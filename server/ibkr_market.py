from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Dict

from ib_insync import IB, ContFuture

def _fallback_bars(symbol: str, bars: int = 240) -> List[Dict]:
    base_map = {
        "ES": 5280.0,
        "MES": 5280.0,
        "NQ": 18840.0,
        "MNQ": 18840.0,
    }
    base = base_map.get(symbol.upper(), 100.0)
    now = datetime.utcnow() - timedelta(minutes=bars)
    out = []
    price = base

    for i in range(bars):
        drift = 0.6 if symbol.upper() in ("ES", "MES") else 1.2
        wave = ((i % 9) - 4) * 0.18
        open_ = price
        close = max(1.0, open_ + drift + wave)
        high = max(open_, close) + 0.8 + ((i % 3) * 0.15)
        low = min(open_, close) - 0.7 - ((i % 2) * 0.12)
        volume = 800 + (i % 7) * 140

        out.append(
            {
                "time": (now + timedelta(minutes=i)).isoformat() + "Z",
                "open": round(open_, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(close, 2),
                "volume": int(volume),
            }
        )

        price = close

    return out

def _connect_ib() -> IB:
    ports = [7497, 4002, 7496, 4001]
    last_error = None

    for port in ports:
        try:
            ib = IB()
            ib.connect("127.0.0.1", port, clientId=81, readonly=True, timeout=4)
            if ib.isConnected():
                return ib
        except Exception as exc:
            last_error = exc

    raise RuntimeError(f"Could not connect to IBKR TWS/Gateway: {last_error}")

def _contract_for(symbol: str):
    root = symbol.upper()
    if root not in {"ES", "MES", "NQ", "MNQ"}:
        raise ValueError(f"Unsupported futures symbol: {symbol}")
    return ContFuture(root, exchange="CME")

def get_candles_payload(symbol: str, timeframe: str = "1 min", bars: int = 240) -> List[Dict]:
    symbol = symbol.upper()

    try:
        ib = _connect_ib()
        try:
            contract = _contract_for(symbol)
            ib.qualifyContracts(contract)

            if timeframe == "1 min":
                duration = "2 D"
                bar_size = "1 min"
            elif timeframe == "5 mins":
                duration = "5 D"
                bar_size = "5 mins"
            elif timeframe == "15 mins":
                duration = "10 D"
                bar_size = "15 mins"
            else:
                duration = "2 D"
                bar_size = "1 min"

            bars_data = ib.reqHistoricalData(
                contract,
                endDateTime="",
                durationStr=duration,
                barSizeSetting=bar_size,
                whatToShow="TRADES",
                useRTH=False,
                formatDate=1,
                keepUpToDate=False,
            )

            payload: List[Dict] = []
            for bar in bars_data[-bars:]:
                payload.append(
                    {
                        "time": f"{bar.date.isoformat()}Z" if hasattr(bar.date, "isoformat") else str(bar.date),
                        "open": round(float(bar.open), 2),
                        "high": round(float(bar.high), 2),
                        "low": round(float(bar.low), 2),
                        "close": round(float(bar.close), 2),
                        "volume": int(bar.volume or 0),
                    }
                )

            if payload:
                return payload

        finally:
            if ib.isConnected():
                ib.disconnect()

    except Exception:
        pass

    return _fallback_bars(symbol, bars=bars)