from server.algo_api import router as algo_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.ibkr_scanner import get_scanner_snapshot
import traceback
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

CACHE_SECONDS = 3
ROW_TTL_SECONDS = 180

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
            x.get("rvol", 0)
        ),
        reverse=True
    )

    clean_rows = []
    for row in rows:
        r = dict(row)
        r.pop("_seenAt", None)
        clean_rows.append(r)

    return clean_rows

@app.get("/scanner")
def scanner():
    global _last_refresh_ts

    try:
        now = time.time()

        if now - _last_refresh_ts >= CACHE_SECONDS:
            fresh_rows = get_scanner_snapshot()

            # only update cache if IBKR actually returned something
            if isinstance(fresh_rows, list) and len(fresh_rows) > 0:
                rows = merge_rows(fresh_rows, now)
                _last_refresh_ts = now
            else:
                rows = merge_rows([], now)
        else:
            rows = merge_rows([], now)

        return {
            "ok": True,
            "updatedAt": _last_refresh_ts,
            "rows": rows
        }

    except Exception as e:
        rows = merge_rows([], time.time())
        return {
            "ok": True,
            "updatedAt": _last_refresh_ts,
            "rows": rows,
            "warning": str(e)
        }
