import os
import logging
import time
from datetime import datetime

import yfinance as yf

logger = logging.getLogger(__name__)

_FINANCE_DOMAINS = [
    "moneycontrol.com", "economictimes.indiatimes.com", "livemint.com",
    "bseindia.com", "nseindia.com", "finance.yahoo.com",
    "reuters.com", "bloomberg.com", "cnbc.com", "marketwatch.com",
    "business-standard.com", "financialexpress.com",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _time_ago(ts: int) -> str:
    diff = int(time.time()) - ts
    if diff < 60:    return "just now"
    if diff < 3600:  return f"{diff // 60}m ago"
    if diff < 86400: return f"{diff // 3600}h ago"
    return f"{diff // 86400}d ago"


def _parse_yf_article(item: dict, symbol: str):
    """Handle both yfinance <=0.2 flat and >=1.3 nested formats."""
    content = item.get("content", {})
    if isinstance(content, dict) and content:
        title     = content.get("title", "")
        url       = (content.get("canonicalUrl") or {}).get("url", "")
        publisher = (content.get("provider") or {}).get("displayName", "")
        pub_str   = content.get("pubDate", "")
        try:
            ts = int(datetime.fromisoformat(pub_str.replace("Z", "+00:00")).timestamp()) if pub_str else 0
        except Exception:
            ts = 0
    else:
        title     = item.get("title", "")
        url       = item.get("link", "")
        publisher = item.get("publisher", "")
        ts        = item.get("providerPublishTime", 0)

    if not title or not url:
        return None
    return {
        "title":    title,
        "url":      url,
        "source":   publisher or (url.split("/")[2] if "/" in url else url),
        "time_ago": _time_ago(ts) if ts else "recently",
        "symbol":   symbol,
    }


# ── Data sources ──────────────────────────────────────────────────────────────

def _yfinance_news(symbol: str, max_results: int = 8) -> list:
    """Stock-specific news via yfinance (no API key required)."""
    try:
        raw = yf.Ticker(symbol).news or []
        articles = [a for item in raw[:max_results] if (a := _parse_yf_article(item, symbol))]
        logger.info(f"[news] yfinance: {len(articles)} articles for {symbol}")
        return articles
    except Exception as e:
        logger.warning(f"[news] yfinance failed for {symbol}: {e}")
        return []


def _tavily_news(query: str, max_results: int = 8) -> list:
    """General finance news via Tavily (requires TAVILY_API_KEY)."""
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        logger.warning("[news] TAVILY_API_KEY not set — skipping Tavily")
        return []
    try:
        from tavily import TavilyClient
        resp = TavilyClient(api_key=api_key).search(
            query, max_results=max_results, include_domains=_FINANCE_DOMAINS
        )
        articles = []
        for r in resp.get("results", []):
            title = r.get("title", "").strip()
            url   = r.get("url", "").strip()
            if title and url:
                articles.append({
                    "title":    title[:160],
                    "url":      url,
                    "source":   url.split("/")[2] if "/" in url else url,
                    "time_ago": "recently",
                    "symbol":   None,
                })
        logger.info(f"[news] Tavily: {len(articles)} articles for {query!r}")
        return articles
    except Exception as e:
        logger.warning(f"[news] Tavily failed: {e}")
        return []


# ── Public API ────────────────────────────────────────────────────────────────

def fetch_news(query: str = "") -> dict:
    """
    Main entry point.
    - Stock name/ticker in query → yfinance news (+ Tavily supplement if sparse)
    - General or empty query    → Tavily finance news
    """
    from backend.Agents.market_agent import _lookup_map

    symbol = _lookup_map(query) if query else None

    if symbol:
        articles = _yfinance_news(symbol)
        label    = f"Latest news · {symbol}"
        if len(articles) < 3:
            articles += _tavily_news(f"{symbol} stock news")
    else:
        search_q = query if query else "Indian stock market NSE BSE news today"
        articles = _tavily_news(search_q)
        label    = "Finance News"

    if not articles:
        articles = _tavily_news("stock market financial news today")
        label    = "Finance News"

    # Deduplicate by URL
    seen, unique = set(), []
    for a in articles:
        if a["url"] not in seen:
            seen.add(a["url"])
            unique.append(a)

    return {"articles": unique, "label": label, "count": len(unique)}
