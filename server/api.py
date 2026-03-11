from server.algo_api import router as algo_router
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from server.ibkr_scanner import get_scanner_snapshot
from server.ibkr_market import get_candles_payload
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
import time

app = FastAPI()

app.include_router(algo_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE_SECONDS = 5
ROW_TTL_SECONDS = 240
SCANNER_TIMEOUT_SECONDS = 2.2

_snapshot_rows = {}
_last_refresh_ts = 0.0

def merge_rows(new_rows, now_ts):
    global _snapshot_rows

    for row in new_rows:
        ticker = row.get("ticker")
        if not ticker:
            continue

        previous = _snapshot_rows.get(ticker, {})
        merged = dict(previous)
        merged.update(row)
        merged["_seenAt"] = now_ts
        _snapshot_rows[ticker] = merged

    filtered = {}
    for ticker, row in _snapshot_rows.items():
        seen_at = row.get("_seenAt", 0)
        if now_ts - seen_at <= ROW_TTL_SECONDS:
            filtered[ticker] = row

    _snapshot_rows = filtered

    rows = list(_snapshot_rows.values())
    rows.sort(
        key=lambda x: (
            x.get("score", 0),
            x.get("premarketPct", 0),
            x.get("gap", 0),
            x.get("rvol", 0),
        ),
        reverse=True,
    )

    clean_rows = []
    for row in rows:
        r = dict(row)
        r.pop("_seenAt", None)
        clean_rows.append(r)

    return clean_rows

def safe_scanner_fetch():
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(get_scanner_snapshot)
        try:
            return future.result(timeout=SCANNER_TIMEOUT_SECONDS)
        except FuturesTimeoutError:
            return None
        except Exception:
            return None

@app.get("/scanner")
def scanner():
    global _last_refresh_ts

    now = time.time()

    try:
        if now - _last_refresh_ts >= CACHE_SECONDS:
            fresh_rows = safe_scanner_fetch()

            if isinstance(fresh_rows, list) and len(fresh_rows) > 0:
                rows = merge_rows(fresh_rows, now)
                _last_refresh_ts = now
                return {
                    "ok": True,
                    "updatedAt": _last_refresh_ts,
                    "rows": rows,
                    "source": "live",
                }

            rows = merge_rows([], now)
            return {
                "ok": True,
                "updatedAt": _last_refresh_ts,
                "rows": rows,
                "source": "cache",
                "warning": "Scanner fetch timed out or returned no rows.",
            }

        rows = merge_rows([], now)
        return {
            "ok": True,
            "updatedAt": _last_refresh_ts,
            "rows": rows,
            "source": "cache",
        }

    except Exception as e:
        rows = merge_rows([], time.time())
        return {
            "ok": True,
            "updatedAt": _last_refresh_ts,
            "rows": rows,
            "source": "cache",
            "warning": str(e),
        }

@app.get("/market/candles")
def market_candles(
    symbol: str = Query("ES"),
    timeframe: str = Query("1 min"),
    bars: int = Query(240),
):
    payload = get_candles_payload(symbol=symbol.upper(), timeframe=timeframe, bars=bars)
    return {
        "ok": True,
        "symbol": symbol.upper(),
        "timeframe": timeframe,
        "bars": payload,
    }