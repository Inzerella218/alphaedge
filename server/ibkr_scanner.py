import os
import math
import random
import asyncio
import datetime
import urllib.parse
import feedparser
import yfinance as yf
from ib_insync import IB, ScannerSubscription

IB_HOST = os.getenv("IB_HOST", "127.0.0.1")
IB_PORT = int(os.getenv("IB_PORT", "7497"))

def safe_float(v, default=0.0):
    try:
        v = float(v)
        if math.isnan(v) or math.isinf(v):
            return default
        return round(v, 2)
    except:
        return default

def get_ibkr_symbols():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    ib = IB()

    try:
        client = random.randint(1000, 9000)

        # longer timeout so brief IBKR lag doesn't kill the scan
        ib.connect(IB_HOST, IB_PORT, clientId=client, timeout=20)

        scan = ScannerSubscription(
            instrument="STK",
            locationCode="STK.US.MAJOR",
            scanCode="TOP_PERC_GAIN"
        )

        data = ib.reqScannerData(scan)

        symbols = []
        for r in data[:8]:
            symbols.append(r.contractDetails.contract.symbol)

        return symbols

    except Exception:
        return []

    finally:
        if ib.isConnected():
            ib.disconnect()

def get_catalyst_and_age(symbol):
    try:
        query = urllib.parse.quote(f'{symbol} stock')
        url = f'https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en'
        feed = feedparser.parse(url)

        if not feed.entries:
            return "", None

        latest = feed.entries[0]

        if not hasattr(latest, "published_parsed") or latest.published_parsed is None:
            return "", None

        published_dt = datetime.datetime(*latest.published_parsed[:6], tzinfo=datetime.timezone.utc)
        now_dt = datetime.datetime.now(datetime.timezone.utc)
        diff_minutes = round((now_dt - published_dt).total_seconds() / 60, 1)

        if diff_minutes <= 60:
            return "**** 1H", diff_minutes
        if diff_minutes <= 120:
            return "** 2H", diff_minutes

        return "", diff_minutes

    except:
        return "", None

def calc_score(price, gap, rvol, catalyst):
    score = 0

    if 2 <= price <= 20:
        score += 20

    if gap >= 5:
        score += 15
    if gap >= 10:
        score += 15
    if gap >= 20:
        score += 10

    if rvol >= 1.5:
        score += 10
    if rvol >= 2:
        score += 10
    if rvol >= 4:
        score += 10

    if catalyst == "** 2H":
        score += 5
    if catalyst == "**** 1H":
        score += 10

    return min(score, 100)

def calc_signal(score):
    if score >= 80:
        return "A SETUP"
    if score >= 60:
        return "B SETUP"
    return "NO TRADE"

def get_snapshot(symbol):
    try:
        t = yf.Ticker(symbol)
        fi = getattr(t, "fast_info", {}) or {}

        price = safe_float(fi.get("lastPrice", 0))
        prev = safe_float(fi.get("previousClose", 0))

        if price <= 0:
            hist = t.history(period="1d", interval="1m", prepost=True, auto_adjust=False)
            if not hist.empty:
                price = safe_float(hist["Close"].dropna().iloc[-1], 0)

        gap = 0
        if prev > 0 and price > 0:
            gap = safe_float(((price - prev) / prev) * 100)

        avg_vol = safe_float(fi.get("tenDayAverageVolume", 0))
        day_vol = safe_float(fi.get("lastVolume", 0))

        rvol = 0
        if avg_vol > 0 and day_vol > 0:
            rvol = safe_float(day_vol / avg_vol)

        pm_price = 0
        pm_pct = 0
        try:
            info = t.info or {}
            pm_price = safe_float(info.get("preMarketPrice", 0))
            pm_pct = safe_float(info.get("preMarketChangePercent", 0))

            if pm_pct == 0 and prev > 0 and pm_price > 0:
                pm_pct = safe_float(((pm_price - prev) / prev) * 100)
        except:
            pm_price = 0
            pm_pct = 0

        catalyst, news_age = get_catalyst_and_age(symbol)

        score = calc_score(price, gap, rvol, catalyst)
        signal = calc_signal(score)

        return {
            "ticker": symbol,
            "price": price,
            "gap": gap,
            "premarketPrice": pm_price,
            "premarketPct": pm_pct,
            "rvol": rvol,
            "float": 0,
            "vwap": "UNKNOWN",
            "volumeTrend": "UNKNOWN",
            "pattern": "NONE",
            "score": score,
            "signal": signal,
            "catalyst": catalyst,
            "newsAgeMinutes": news_age
        }

    except:
        return None

def get_scanner_snapshot():
    symbols = get_ibkr_symbols()

    if not symbols:
        return []

    out = []

    for s in symbols:
        row = get_snapshot(s)
        if row:
            out.append(row)

    out.sort(
        key=lambda x: (x["score"], x["premarketPct"], x["gap"], x["rvol"]),
        reverse=True
    )

    return out
