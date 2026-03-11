import os
import random
import asyncio
import yfinance as yf
from ib_insync import IB, ScannerSubscription

IB_HOST = os.getenv("IB_HOST", "127.0.0.1")
IB_PORT = int(os.getenv("IB_PORT", "7497"))

def get_ibkr_symbols():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    ib = IB()

    try:
        client = random.randint(1000,9000)

        ib.connect(IB_HOST, IB_PORT, clientId=client)

        scan = ScannerSubscription(
            instrument="STK",
            locationCode="STK.US.MAJOR",
            scanCode="TOP_PERC_GAIN"
        )

        data = ib.reqScannerData(scan)

        symbols = []
        for r in data[:12]:
            symbols.append(r.contractDetails.contract.symbol)

        return symbols

    finally:
        if ib.isConnected():
            ib.disconnect()

def get_snapshot(symbol):
    try:
        t = yf.Ticker(symbol)
        fi = t.fast_info

        price = float(fi.get("lastPrice",0))
        prev = float(fi.get("previousClose",0))

        gap = 0
        if prev > 0:
            gap = round(((price-prev)/prev)*100,2)

        return {
            "ticker": symbol,
            "price": price,
            "gap": gap,
            "rvol": 0,
            "float": 0,
            "vwap": "UNKNOWN",
            "volumeTrend": "UNKNOWN",
            "pattern": "NONE",
            "score": 0,
            "signal": "WAIT",
            "catalyst": ""
        }

    except:
        return None

def get_scanner_snapshot():
    symbols = get_ibkr_symbols()

    out = []

    for s in symbols:
        row = get_snapshot(s)
        if row:
            out.append(row)

    return out
