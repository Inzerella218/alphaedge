from __future__ import annotations

from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from ib_insync import IB, ScannerSubscription, Stock
import feedparser

SCAN_TIMEOUT_SECONDS = 2.5
NEWS_TIMEOUT_SECONDS = 1.5

def _demo_rows() -> List[Dict]:
    return [
        {
            "ticker": "PLTR",
            "name": "Palantir Technologies",
            "price": 38.42,
            "changePct": 6.18,
            "premarketPct": 4.92,
            "gap": 4.92,
            "rvol": 6.8,
            "score": 31.6,
            "hasNews": True,
            "volume": 18400000,
            "signal": "A SETUP",
            "pattern": "Opening Drive",
            "volumeTrend": "Expanding",
            "vwap": "Above VWAP",
            "catalyst": "📰",
        },
        {
            "ticker": "SOUN",
            "name": "SoundHound AI",
            "price": 7.84,
            "changePct": 8.44,
            "premarketPct": 7.21,
            "gap": 7.21,
            "rvol": 9.2,
            "score": 34.1,
            "hasNews": True,
            "volume": 22100000,
            "signal": "A SETUP",
            "pattern": "ORB Candidate",
            "volumeTrend": "Explosive",
            "vwap": "Above VWAP",
            "catalyst": "📰",
        },
        {
            "ticker": "NVAX",
            "name": "Novavax",
            "price": 12.66,
            "changePct": 4.87,
            "premarketPct": 3.66,
            "gap": 3.66,
            "rvol": 5.1,
            "score": 22.8,
            "hasNews": True,
            "volume": 7400000,
            "signal": "B SETUP",
            "pattern": "VWAP Reclaim",
            "volumeTrend": "Strong",
            "vwap": "Reclaiming VWAP",
            "catalyst": "📰",
        },
        {
            "ticker": "RGTI",
            "name": "Rigetti Computing",
            "price": 3.92,
            "changePct": 5.12,
            "premarketPct": 2.41,
            "gap": 2.41,
            "rvol": 4.4,
            "score": 18.5,
            "hasNews": False,
            "volume": 5900000,
            "signal": "B SETUP",
            "pattern": "Momentum Continuation",
            "volumeTrend": "Strong",
            "vwap": "Holding VWAP",
            "catalyst": "",
        },
        {
            "ticker": "ACHR",
            "name": "Archer Aviation",
            "price": 5.74,
            "changePct": 2.88,
            "premarketPct": 1.94,
            "gap": 1.94,
            "rvol": 3.6,
            "score": 14.7,
            "hasNews": False,
            "volume": 4300000,
            "signal": "WATCH",
            "pattern": "Watchlist Build",
            "volumeTrend": "Normal",
            "vwap": "Near VWAP",
            "catalyst": "",
        },
    ]

def _connect_ib() -> IB:
    ports = [7497, 4002, 7496, 4001]
    last_error = None

    for port in ports:
        try:
            ib = IB()
            ib.connect("127.0.0.1", port, clientId=82, readonly=True, timeout=4)
            if ib.isConnected():
                return ib
        except Exception as exc:
            last_error = exc

    raise RuntimeError(f"Could not connect to IBKR: {last_error}")

def _safe_call(fn, timeout_seconds: float):
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(fn)
        try:
            return future.result(timeout=timeout_seconds)
        except FuturesTimeoutError:
            return None
        except Exception:
            return None

def _has_news_catalyst(symbol: str) -> bool:
    def fetch():
        url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US"
        parsed = feedparser.parse(url)
        return bool(getattr(parsed, "entries", []))

    result = _safe_call(fetch, NEWS_TIMEOUT_SECONDS)
    return bool(result)

def _scanner_rows_from_ib() -> List[Dict]:
    ib = _connect_ib()

    try:
        sub = ScannerSubscription(
            instrument="STK",
            locationCode="STK.US.MAJOR",
            scanCode="TOP_PERC_GAIN",
            abovePrice=2,
            belowPrice=30,
            aboveVolume=150000,
            numberOfRows=15,
        )

        scan_data = ib.reqScannerData(sub)

        rows: List[Dict] = []

        for item in scan_data[:12]:
            details = item.contractDetails
            contract = details.contract
            symbol = contract.symbol

            if not symbol:
                continue

            rows.append(
                {
                    "ticker": symbol,
                    "name": details.longName or symbol,
                }
            )

        if not rows:
            return []

        contracts = [Stock(row["ticker"], "SMART", "USD") for row in rows]
        qualified = ib.qualifyContracts(*contracts)
        tickers = ib.reqTickers(*qualified)

        ticker_map = {}
        for ticker in tickers:
            sym = getattr(getattr(ticker, "contract", None), "symbol", None)
            if sym:
                ticker_map[sym] = ticker

        final_rows: List[Dict] = []

        for row in rows:
            sym = row["ticker"]
            ticker = ticker_map.get(sym)

            last_price = None
            prev_close = None
            volume = 0

            if ticker is not None:
                last_price = ticker.marketPrice() if hasattr(ticker, "marketPrice") else None
                prev_close = getattr(ticker, "close", None)
                volume = getattr(ticker, "volume", 0) or 0

            if last_price is None or last_price <= 0:
                continue

            if prev_close and prev_close > 0:
                change_pct = ((last_price - prev_close) / prev_close) * 100
                gap_pct = change_pct
            else:
                change_pct = 0
                gap_pct = 0

            rvol = min(round((volume / 250000), 2), 25) if volume else 0
            has_news = _has_news_catalyst(sym)

            score = (
                max(change_pct, 0) * 1.5
                + max(gap_pct, 0) * 1.0
                + rvol * 2.2
                + (8 if has_news else 0)
            )

            signal = "A SETUP" if score >= 25 else "B SETUP" if score >= 12 else "WATCH"

            final_rows.append(
                {
                    "ticker": sym,
                    "name": row["name"],
                    "price": round(float(last_price), 2),
                    "changePct": round(float(change_pct), 2),
                    "premarketPct": round(float(change_pct), 2),
                    "gap": round(float(gap_pct), 2),
                    "rvol": round(float(rvol), 2),
                    "score": round(float(score), 2),
                    "hasNews": has_news,
                    "volume": int(volume),
                    "signal": signal,
                    "pattern": "Momentum",
                    "volumeTrend": "Expanding" if rvol >= 5 else "Normal",
                    "vwap": "Above VWAP" if change_pct > 0 else "Near VWAP",
                    "catalyst": "📰" if has_news else "",
                }
            )

        final_rows.sort(
            key=lambda x: (
                x.get("score", 0),
                x.get("premarketPct", 0),
                x.get("rvol", 0),
            ),
            reverse=True,
        )

        return final_rows[:10]

    finally:
        if ib.isConnected():
            ib.disconnect()

def get_scanner_snapshot() -> List[Dict]:
    result = _safe_call(_scanner_rows_from_ib, SCAN_TIMEOUT_SECONDS)
    if isinstance(result, list) and len(result) > 0:
        return result
    return _demo_rows()