"""
Economic calendar and earnings data for AlphaEdge dashboard.

Economic events: curated 2026 schedule of high-impact US releases.
Earnings: live from FMP earnings calendar with bandwidth-aware caching and confirmed fallback.
"""

from datetime import datetime, timezone, timedelta
import os
import time
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

try:
    import requests as _requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False

# Economic Calendar

_ECON_EVENTS_2026 = [
    {"date": "2026-03-12", "time": "7:30 AM", "event": "CPI (Consumer Price Index)", "impact": "High",
     "currency": "USD", "note": "Inflation read. Beats or misses shift Fed rate expectations and reprice bonds fast."},
    {"date": "2026-03-12", "time": "7:30 AM", "event": "Initial Jobless Claims", "impact": "High",
     "currency": "USD", "note": "Weekly labor report. Spike signals labor market weakness; decline shows strength."},
    {"date": "2026-03-12", "time": "10:00 AM", "event": "Fed Speaker - Powell", "impact": "High",
     "currency": "USD", "note": "Fed Chair commentary. Market hangs on every word about policy path."},
]

def get_events_for_date(date_str: str) -> list:
    events = [dict(e) for e in _ECON_EVENTS_2026 if e["date"] == date_str]

    now = datetime.now(timezone.utc)
    ct_tz = ZoneInfo("America/Chicago")
    now_ct = now.astimezone(ct_tz)

    for event in events:
        try:
            event_time_str = event["time"]
            time_parts = event_time_str.split()
            hour_min = time_parts[0].split(":")
            hour = int(hour_min[0])
            minute = int(hour_min[1])

            if len(time_parts) > 1 and time_parts[1] == "PM" and hour != 12:
                hour += 12
            elif len(time_parts) > 1 and time_parts[1] == "AM" and hour == 12:
                hour = 0

            event_dt = datetime(
                int(date_str[:4]),
                int(date_str[5:7]),
                int(date_str[8:10]),
                hour,
                minute,
                tzinfo=ct_tz,
            )

            if now_ct > event_dt:
                event["status"] = "past"
                event["statusLabel"] = "Released"
            elif now_ct > event_dt - timedelta(minutes=5):
                event["status"] = "current"
                event["statusLabel"] = "Soon"
            else:
                event["status"] = "upcoming"
                event["statusLabel"] = "Upcoming"
        except Exception:
            event["status"] = "upcoming"
            event["statusLabel"] = "Upcoming"

    return events


def get_day_pressure(events: list) -> dict:
    high_count = sum(1 for e in events if e.get("impact") == "High")

    if high_count == 0:
        return {
            "level": "Low",
            "label": "Quiet Day",
            "color": "green",
            "summary": "No major scheduled releases. Structure and momentum drive the tape today.",
        }
    if high_count == 1:
        return {
            "level": "Medium",
            "label": "Moderate Risk",
            "color": "yellow",
            "summary": f"One high-impact release today. Size appropriately around {events[0]['time']} CT.",
        }

    names = " + ".join(e["event"].split(" ")[0] for e in events[:2])
    return {
        "level": "High",
        "label": "High Pressure Day",
        "color": "red",
        "summary": f"{names} today. Expect volatility spikes. Size down and let the market prove direction first.",
    }


# Earnings

_earnings_cache: dict = {}
_earnings_last_fetch: dict = {}

FMP_API_KEY = os.getenv("FMP_API_KEY", "").strip()


def _normalize_timing(raw: str) -> tuple[str, str]:
    value = (raw or "").strip().lower()
    if value in ("bmo", "before open", "pre-market", "pre market"):
        return "Before Open", "BMO"
    if value in ("amc", "after close", "post-market", "post market"):
        return "After Close", "AMC"
    if value in ("dmh", "during market", "during market hours"):
        return "During Market", "DMH"
    return "Time TBD", "TNS"


def _earnings_cache_seconds_for_now() -> int:
    """Smart scan schedule to conserve FMP API credits.

    Only scan aggressively right before/after BMO and AMC windows.
    All times in CT (Chicago).

    Schedule:
      Weekends:              12 hours
      Midnight - 5:59 AM:    6 hours   (nothing happening)
      6:00 AM - 8:29 AM:     10 min    (BMO earnings about to drop / dropping)
      8:30 AM - 9:29 AM:     10 min    (catch BMO stragglers reporting late)
      9:30 AM - 2:59 PM:     2 hours   (mid-day, nothing to catch)
      3:00 PM - 4:14 PM:     15 min    (AMC earnings about to drop)
      4:15 PM - 5:29 PM:     10 min    (AMC earnings dropping)
      5:30 PM - 11:59 PM:    6 hours   (done for the day)
    """
    now_ct = datetime.now(timezone.utc).astimezone(ZoneInfo("America/Chicago"))

    if now_ct.weekday() >= 5:
        return 60 * 60 * 12

    minutes = now_ct.hour * 60 + now_ct.minute

    if minutes < 360:          # before 6 AM
        return 60 * 60 * 6
    if minutes < 510:          # 6:00 AM - 8:29 AM (BMO window)
        return 60 * 10
    if minutes < 570:          # 8:30 AM - 9:29 AM (BMO stragglers)
        return 60 * 10
    if minutes < 900:          # 9:30 AM - 2:59 PM (mid-day)
        return 60 * 60 * 2
    if minutes < 975:          # 3:00 PM - 4:14 PM (pre-AMC)
        return 60 * 15
    if minutes < 1050:         # 4:15 PM - 5:29 PM (AMC window)
        return 60 * 10
    return 60 * 60 * 6         # after 5:30 PM


def _safe_float(value):
    try:
        if value is None or value == "":
            return None
        return float(value)
    except Exception:
        return None


def _fmp_get(url: str, params: dict) -> list:
    """GET a FMP endpoint, return list or empty."""
    try:
        headers = {"User-Agent": "AlphaEdge/1.0", "Accept": "application/json"}
        resp = _requests.get(url, headers=headers, params=params, timeout=10)
        if resp.status_code != 200:
            return []
        data = resp.json()
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _merge_entry(merged: dict, entry: dict):
    """Merge an earnings entry into the dict, keeping richer data."""
    ticker = entry["ticker"]
    existing = merged.get(ticker)
    if not existing:
        merged[ticker] = entry
        return

    # Prefer non-null numeric values
    for key in ("epsEstimate", "epsActual", "revenueEstimate", "revenueActual"):
        if entry.get(key) is None and existing.get(key) is not None:
            entry[key] = existing[key]

    # Prefer known timing over TNS
    if entry.get("timingCode") == "TNS" and existing.get("timingCode") != "TNS":
        entry["timing"] = existing["timing"]
        entry["timingCode"] = existing["timingCode"]

    # Prefer longer name
    if len(existing.get("name", "")) > len(entry.get("name", "")):
        entry["name"] = existing["name"]

    merged[ticker] = entry


def _scrape_investing_com() -> list:
    """Scrape today's earnings from Investing.com (free, no API key needed).
    Returns full list with EPS est/actual for all reporting companies.
    """
    if not _HAS_REQUESTS:
        return []

    try:
        from bs4 import BeautifulSoup
    except ImportError:
        return []

    import re

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/131.0.0.0 Safari/537.36",
        }
        resp = _requests.get(
            "https://www.investing.com/earnings-calendar/",
            headers=headers,
            timeout=12,
        )
        if resp.status_code != 200:
            return []

        soup = BeautifulSoup(resp.text, "lxml")
        table = soup.find("table")
        if not table:
            return []

        rows = table.find_all("tr")
        items = []

        for tr in rows:
            tds = tr.find_all("td")
            if len(tds) < 8:
                continue

            company_text = tds[1].get_text(" ", strip=True)
            m = re.search(r"\(\s*([A-Z0-9.]{1,10})\s*\)", company_text)
            if not m:
                continue

            ticker = m.group(1)
            name = company_text.split("(")[0].strip()

            # EPS: cell[2] = "actual /" cell[3] = estimate
            eps_actual_raw = tds[2].get_text(strip=True).replace("/", "").strip()
            eps_estimate_raw = tds[3].get_text(strip=True)

            # Revenue: cell[4] = "actual /" cell[5] = estimate
            rev_actual_raw = tds[4].get_text(strip=True).replace("/", "").strip()
            rev_estimate_raw = tds[5].get_text(strip=True)

            def _parse_num(s):
                s = s.replace(",", "").strip()
                if not s or s == "-" or s == "aa.aa":
                    return None
                # Handle B/M suffixes for revenue
                mult = 1
                if s.endswith("B"):
                    mult = 1_000_000_000
                    s = s[:-1]
                elif s.endswith("M"):
                    mult = 1_000_000
                    s = s[:-1]
                elif s.endswith("K"):
                    mult = 1_000
                    s = s[:-1]
                try:
                    return float(s) * mult
                except Exception:
                    return None

            items.append({
                "ticker": ticker,
                "name": name[:60],
                "timing": "Time TBD",
                "timingCode": "TNS",
                "epsEstimate": _parse_num(eps_estimate_raw),
                "epsActual": _parse_num(eps_actual_raw),
                "revenueEstimate": _parse_num(rev_estimate_raw),
                "revenueActual": _parse_num(rev_actual_raw),
            })

        return items

    except Exception:
        return []


def _fetch_fmp_earnings(date_str: str) -> list:
    """Fetch from FMP stable endpoint (enriches with timing data)."""
    if not FMP_API_KEY:
        return []

    data = _fmp_get(
        "https://financialmodelingprep.com/stable/earnings-calendar",
        {"from": date_str, "to": date_str, "apikey": FMP_API_KEY},
    )

    items = []
    for item in data:
        ticker = (item.get("symbol") or "").upper()
        if not ticker:
            continue

        raw_date = str(item.get("date") or "")[:10]
        if raw_date and raw_date != date_str:
            continue

        timing_label, timing_code = _normalize_timing(
            item.get("time") or item.get("when") or ""
        )

        items.append({
            "ticker": ticker,
            "name": item.get("name") or ticker,
            "timing": timing_label,
            "timingCode": timing_code,
            "epsEstimate": _safe_float(item.get("epsEstimated")),
            "epsActual": _safe_float(item.get("eps") or item.get("epsActual")),
            "revenueEstimate": _safe_float(item.get("revenueEstimated")),
            "revenueActual": _safe_float(item.get("revenue")),
        })

    return items


def fetch_earnings(date_str: str) -> list:
    """Fetch earnings: Investing.com (full list) + FMP (timing enrichment).

    Primary source: Investing.com scrape (free, 200+ companies, EPS est+actual).
    Secondary: FMP API (adds BMO/AMC timing where available).
    """
    if not _HAS_REQUESTS:
        return []

    merged = {}

    # 1) Investing.com = primary source (all earnings, EPS data)
    for item in _scrape_investing_com():
        _merge_entry(merged, item)

    # 2) FMP = enrich with timing (BMO/AMC)
    for item in _fetch_fmp_earnings(date_str):
        _merge_entry(merged, item)

    items = list(merged.values())
    items.sort(key=lambda x: x["ticker"])
    return items


def get_earnings_for_date(date_str: str) -> dict:
    now = time.time()
    cache_seconds = _earnings_cache_seconds_for_now()

    if (
        date_str in _earnings_cache
        and now - _earnings_last_fetch.get(date_str, 0) < cache_seconds
    ):
        ttl = int(cache_seconds - (now - _earnings_last_fetch[date_str]))
        return {
            "ok": True,
            "items": _earnings_cache[date_str],
            "source": "cache",
            "nextScanIn": ttl,
        }

    fresh = fetch_earnings(date_str)
    if fresh:
        _earnings_cache[date_str] = fresh
        _earnings_last_fetch[date_str] = now
        return {
            "ok": True,
            "items": fresh,
            "source": "live",
            "nextScanIn": cache_seconds,
        }

    if date_str in _earnings_cache:
        return {
            "ok": True,
            "items": _earnings_cache[date_str],
            "source": "cache",
            "warning": "Stale",
            "nextScanIn": 60,
        }

    return {
        "ok": True,
        "items": [],
        "source": "none",
        "warning": "Live earnings feed unavailable",
    }

