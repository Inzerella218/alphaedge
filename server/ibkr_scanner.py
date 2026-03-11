import os
import random
import asyncio
from ib_insync import IB, ScannerSubscription

IB_HOST = os.getenv("IB_HOST", "127.0.0.1")
IB_PORT = int(os.getenv("IB_PORT", "7497"))

def get_scanner_snapshot():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    ib = IB()
    client_id = random.randint(1000, 9999)

    try:
        ib.connect(IB_HOST, IB_PORT, clientId=client_id, timeout=10)

        scan = ScannerSubscription(
            instrument="STK",
            locationCode="STK.US.MAJOR",
            scanCode="TOP_PERC_GAIN"
        )

        results = ib.reqScannerData(scan)

        final_results = []

        for r in results[:10]:
            contract = r.contractDetails.contract

            final_results.append({
                "ticker": contract.symbol,
                "price": 0.0,
                "gap": 0,
                "rvol": 0,
                "float": 0,
                "vwap": "UNKNOWN",
                "volumeTrend": "UNKNOWN",
                "pattern": "NONE",
                "score": 0,
                "signal": "WAIT",
                "catalyst": ""
            })

        return final_results

    finally:
        if ib.isConnected():
            ib.disconnect()
        try:
            loop.close()
        except Exception:
            pass
