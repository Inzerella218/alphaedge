from fastapi import APIRouter
from datetime import datetime, timezone
import asyncio
import html
import re

import httpx
from bs4 import BeautifulSoup

router = APIRouter()

WATCH_TERMS = [
    "tariff",
    "fed",
    "powell",
    "rates",
    "inflation",
    "cpi",
    "china",
    "treasury",
    "sanctions",
    "oil",
    "war",
    "jobs",
    "recession",
    "interest rates",
    "yield",
]

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

TRUTH_PUBLIC_ENDPOINTS = [
    "https://truthsocial.com/api/v1/timelines/public?limit=20",
]

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/145.0.0.0 Safari/537.36 AlphaEdge/1.0"
)


def score_market_relevance(text: str) -> bool:
    t = (text or "").lower()
    return any(term in t for term in WATCH_TERMS)


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = html.unescape(text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def fetch_truth_public(client: httpx.AsyncClient) -> list[dict]:
    items: list[dict] = []

    for url in TRUTH_PUBLIC_ENDPOINTS:
        try:
            r = await client.get(url)
            if r.status_code != 200:
                continue

            data = r.json()
            if not isinstance(data, list):
                continue

            for post in data:
                content = clean_text(post.get("content", ""))
                if not content:
                    continue

                account = post.get("account") or {}
                handle = account.get("acct") or account.get("username") or "truthsocial"
                created_at = post.get("created_at") or iso_now()

                items.append(
                    {
                        "id": f"truth-{post.get('id', hash(content))}",
                        "source": "truthsocial",
                        "handle": f"@{handle}",
                        "text": content,
                        "timestamp": created_at,
                        "marketRelevant": score_market_relevance(content),
                    }
                )
        except Exception:
            continue

    return items


def scrape_links_from_html(html_text: str, base_url: str) -> list[str]:
    soup = BeautifulSoup(html_text, "html.parser")
    texts: list[str] = []

    for tag in soup.find_all(["h1", "h2", "h3", "a"]):
        text = clean_text(tag.get_text(" ", strip=True))
        if not text:
            continue
        if len(text) < 25:
            continue
        if len(text) > 300:
            continue
        texts.append(text)

    seen = set()
    deduped = []
    for t in texts:
        key = t.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(t)

    return deduped[:20]


async def fetch_news_source(client: httpx.AsyncClient, cfg: dict) -> list[dict]:
    items: list[dict] = []
    try:
        r = await client.get(cfg["url"])
        if r.status_code != 200:
            return items

        headlines = scrape_links_from_html(r.text, cfg["url"])
        now = iso_now()

        for i, text in enumerate(headlines):
            items.append(
                {
                    "id": f'{cfg["source"]}-{cfg["name"].lower().replace(" ", "-")}-{i}',
                    "source": cfg["source"],
                    "handle": cfg["handle"],
                    "text": text,
                    "timestamp": now,
                    "marketRelevant": score_market_relevance(text),
                }
            )
    except Exception:
        return items

    return items


async def fetch_news_scrape(client: httpx.AsyncClient) -> list[dict]:
    tasks = [fetch_news_source(client, cfg) for cfg in NEWS_SOURCES]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    items: list[dict] = []
    for result in results:
        if isinstance(result, list):
            items.extend(result)

    return items


def dedupe_items(items: list[dict]) -> list[dict]:
    seen = set()
    out = []

    for item in items:
        key = re.sub(r"\s+", " ", item["text"].strip().lower())
        if key in seen:
            continue
        seen.add(key)
        out.append(item)

    return out


@router.get("/market/headlines")
async def get_market_headlines():
    async with httpx.AsyncClient(
        timeout=12,
        follow_redirects=True,
        headers={"User-Agent": USER_AGENT},
    ) as client:
        truth_items, news_items = await asyncio.gather(
            fetch_truth_public(client),
            fetch_news_scrape(client),
        )

    items = truth_items + news_items
    items = dedupe_items(items)

    items.sort(
        key=lambda x: (
            1 if x.get("marketRelevant") else 0,
            x.get("timestamp", ""),
        ),
        reverse=True,
    )

    return {
        "source": "live" if items else "demo",
        "items": items[:30],
        "fetchedAt": iso_now(),
    }