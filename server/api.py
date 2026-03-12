from server.algo_api import router as algo_router
from server.calendar_api import get_events_for_date, get_day_pressure, get_earnings_for_date
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from server.ibkr_scanner import get_scanner_snapshot
from server.ibkr_market import get_candles_payload
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from datetime import datetime, timezone
from bs4 import BeautifulSoup
import re
import time

try:
    import requests as _requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False

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


MARKET_KEYWORDS = {
    "tariff", "tariffs", "fed", "federal reserve", "inflation", "interest rate",
    "rate hike", "rate cut", "economy", "gdp", "jobs", "employment", "recession",
    "market", "stock", "dow", "nasdaq", "s&p", "trade", "china", "sanctions",
    "ukraine", "energy", "oil", "dollar", "debt", "treasury", "powell", "yellen",
    "tax", "budget", "deficit", "spending", "trade war", "import", "export",
    "crypto", "bitcoin", "deregulation", "executive order",
}

_headlines_cache: list = []
_headlines_last_fetch: float = 0.0
HEADLINES_CACHE_SECONDS = 45

NEWS_SOURCES = [
    {
        "name": "Reuters Markets",
        "handle": "@Reuters",
        "url": "https://www.reuters.com/markets/",
        "source": "web",
    },
    {
        "name": "Reuters World",
        "handle": "@Reuters",
        "url": "https://www.reuters.com/world/",
        "source": "web",
    },
    {
        "name": "CNBC Markets",
        "handle": "@CNBC",
        "url": "https://www.cnbc.com/markets/",
        "source": "web",
    },
    {
        "name": "MarketWatch",
        "handle": "@MarketWatch",
        "url": "https://www.marketwatch.com/latest-news",
        "source": "web",
    },
]


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text).strip()


def _clean_text(text: str) -> str:
    text = _strip_html(text or "")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _is_market_relevant(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in MARKET_KEYWORDS)


def _fetch_truth_social() -> list:
    if not _HAS_REQUESTS:
        return []

    try:
        headers = {
            "User-Agent": "AlphaEdge/1.0",
            "Accept": "application/json",
        }

        lookup = _requests.get(
            "https://truthsocial.com/api/v1/accounts/lookup",
            params={"acct": "realDonaldTrump"},
            headers=headers,
            timeout=6,
        )
        if lookup.status_code != 200:
            return []

        account_id = lookup.json().get("id")
        if not account_id:
            return []

        statuses = _requests.get(
            f"https://truthsocial.com/api/v1/accounts/{account_id}/statuses",
            params={"limit": 20, "exclude_replies": "true"},
            headers=headers,
            timeout=6,
        )
        if statuses.status_code != 200:
            return []

        items = []
        for post in statuses.json():
            text = _clean_text(post.get("content", ""))
            if not text:
                continue

            items.append({
                "id": f'truth_{post.get("id", "")}',
                "source": "truthsocial",
                "author": "Donald Trump",
                "handle": "@realDonaldTrump",
                "text": text,
                "timestamp": post.get("created_at", datetime.now(timezone.utc).isoformat()),
                "marketRelevant": _is_market_relevant(text),
                "url": post.get("url", ""),
            })

        return items
    except Exception:
        return []


def _scrape_headlines_from_html(html_text: str) -> list[str]:
    soup = BeautifulSoup(html_text, "html.parser")
    texts = []

    for tag in soup.find_all(["h1", "h2", "h3", "a"]):
        text = _clean_text(tag.get_text(" ", strip=True))
        if not text:
            continue
        if len(text) < 25:
            continue
        if len(text) > 280:
            continue
        texts.append(text)

    seen = set()
    deduped = []
    for text in texts:
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(text)

    return deduped[:15]


def _fetch_news_scrape() -> list:
    if not _HAS_REQUESTS:
        return []

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 AlphaEdge/1.0"
    }

    items = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for cfg in NEWS_SOURCES:
        try:
            r = _requests.get(cfg["url"], headers=headers, timeout=6)
            if r.status_code != 200:
                continue

            headlines = _scrape_headlines_from_html(r.text)
            for i, text in enumerate(headlines):
                items.append({
                    "id": f'{cfg["source"]}_{cfg["name"].lower().replace(" ", "_")}_{i}',
                    "source": cfg["source"],
                    "author": cfg["name"],
                    "handle": cfg["handle"],
                    "text": text,
                    "timestamp": now_iso,
                    "marketRelevant": _is_market_relevant(text),
                    "url": cfg["url"],
                })
        except Exception:
            continue

    return items


def _dedupe_headlines(items: list) -> list:
    seen = set()
    out = []

    for item in items:
        text_key = re.sub(r"\s+", " ", item.get("text", "").strip().lower())
        if not text_key:
            continue
        if text_key in seen:
            continue
        seen.add(text_key)
        out.append(item)

    return out


def _fetch_headlines_combined() -> list:
    truth_items = _fetch_truth_social()
    news_items = _fetch_news_scrape()

    items = truth_items + news_items
    items = _dedupe_headlines(items)

    items.sort(
        key=lambda x: (
            1 if x.get("marketRelevant") else 0,
            x.get("timestamp", ""),
        ),
        reverse=True,
    )

    return items[:30]


def _fetch_headlines_safe() -> list:
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_fetch_headlines_combined)
        try:
            return future.result(timeout=10)
        except Exception:
            return []


_DEMO_HEADLINES = [
    {
        "id": "demo_1",
        "source": "truthsocial",
        "author": "Donald Trump",
        "handle": "@realDonaldTrump",
        "text": "Tariffs, trade, and jobs remain major market-moving political themes.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "marketRelevant": True,
        "url": "",
    },
    {
        "id": "demo_2",
        "source": "web",
        "author": "Markets",
        "handle": "@markets",
        "text": "Fed speakers today may shift risk sentiment. Watch for any language changes around rate path.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "marketRelevant": True,
        "url": "",
    },
]


@app.get("/market/headlines")
def market_headlines():
    global _headlines_cache, _headlines_last_fetch

    now = time.time()

    if now - _headlines_last_fetch < HEADLINES_CACHE_SECONDS and _headlines_cache:
        return {"ok": True, "items": _headlines_cache, "source": "cache"}

    fresh = _fetch_headlines_safe()

    if fresh:
        _headlines_cache = fresh
        _headlines_last_fetch = now
        return {"ok": True, "items": fresh, "source": "live"}

    if _headlines_cache:
        return {
            "ok": True,
            "items": _headlines_cache,
            "source": "cache",
            "warning": "Fetch failed, showing cached",
        }

    return {"ok": True, "items": _DEMO_HEADLINES, "source": "demo"}


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


@app.get("/market/calendar")
def market_calendar(date: str = Query(None)):
    target = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    events = get_events_for_date(target)
    pressure = get_day_pressure(events)
    return {
        "ok": True,
        "date": target,
        "pressure": pressure,
        "events": events,
    }


@app.get("/market/earnings")
def market_earnings(date: str = Query(None)):
    target = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = get_earnings_for_date(target)
    result["date"] = target
    return result


@app.get("/market/earnings/refresh")
def market_earnings_refresh(date: str = Query(None)):
    """Force-clear earnings cache and fetch fresh data."""
    from server.calendar_api import _earnings_cache, _earnings_last_fetch
    target = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    _earnings_cache.pop(target, None)
    _earnings_last_fetch.pop(target, None)
    result = get_earnings_for_date(target)
    result["date"] = target
    result["forced"] = True
    return result


@app.get("/market/earnings/debug")
def market_earnings_debug(date: str = Query(None)):
    """Show raw FMP responses for debugging."""
    from server.calendar_api import FMP_API_KEY, _fmp_get
    target = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    stable_raw = _fmp_get(
        "https://financialmodelingprep.com/stable/earnings-calendar",
        {"from": target, "to": target, "apikey": FMP_API_KEY},
    )
    v3_raw = _fmp_get(
        "https://financialmodelingprep.com/api/v3/earning_calendar",
        {"from": target, "to": target, "apikey": FMP_API_KEY},
    )
    confirmed_raw = _fmp_get(
        "https://financialmodelingprep.com/api/v4/earning-calendar-confirmed",
        {"from": target, "to": target, "apikey": FMP_API_KEY},
    )
    surprises_raw = _fmp_get(
        "https://financialmodelingprep.com/api/v3/earnings-surprises",
        {"apikey": FMP_API_KEY},
    )
    return {
        "date": target,
        "api_key_set": bool(FMP_API_KEY),
        "stable_count": len(stable_raw),
        "stable_sample": stable_raw[:3],
        "v3_count": len(v3_raw),
        "v3_sample": v3_raw[:3],
        "confirmed_count": len(confirmed_raw),
        "confirmed_sample": confirmed_raw[:3],
        "surprises_count": len(surprises_raw),
        "surprises_sample": surprises_raw[:3],
    }