import os
import logging
from langchain_community.tools.tavily_search import TavilySearchResults

logger = logging.getLogger(__name__)

# Finance-scoped search domains — keeps results relevant
FINANCE_DOMAINS = [
    "moneycontrol.com", "economictimes.indiatimes.com", "livemint.com",
    "bseindia.com", "nseindia.com", "finance.yahoo.com",
    "reuters.com", "bloomberg.com", "cnbc.com", "marketwatch.com",
]


def tavily_search(query: str, max_results: int = 5) -> str:
    """
    Search the web for finance information via Tavily.
    Returns a formatted string of results with source URLs.
    Returns empty string if API key is missing or search fails.
    """
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        logger.warning("[tavily] TAVILY_API_KEY not set — skipping web search")
        return ""

    try:
        tool = TavilySearchResults(
            max_results=max_results,
            include_domains=FINANCE_DOMAINS,
        )
        results = tool.invoke({"query": query})

        if not results:
            logger.info("[tavily] no results returned")
            return ""

        lines = []
        for r in results:
            if isinstance(r, dict) and r.get("content"):
                lines.append(f"Source: {r.get('url', 'unknown')}\n{r['content']}")

        context = "\n\n".join(lines)
        logger.info(f"[tavily] {len(lines)} results for: {query[:60]!r}")
        return context

    except Exception as e:
        logger.warning(f"[tavily] search failed: {e}")
        return ""
