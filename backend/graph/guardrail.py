import logging
from backend.Services.LLM import LLMService

logger = logging.getLogger(__name__)
_llm = LLMService(model="gpt-4o-mini")

FINANCE_KEYWORDS = {
    "stock", "share", "shares", "market", "price", "invest", "investment",
    "portfolio", "mutual fund", "crypto", "bitcoin", "ethereum", "forex",
    "bond", "equity", "dividend", "nifty", "sensex", "nasdaq", "dow",
    "ipo", "trading", "trade", "finance", "financial", "economy", "gdp",
    "inflation", "interest rate", "bank", "banking", "insurance", "tax",
    "retirement", "fund", "hedge", "commodity", "gold", "silver", "oil",
    "currency", "exchange", "broker", "demat", "sebi", "rbi", "fed",
    "earnings", "revenue", "profit", "loss", "balance sheet", "valuation",
    "p/e", "pe ratio", "roe", "eps", "market cap", "bull", "bear",
    "tcs", "reliance", "infosys", "wipro", "hdfc", "icici", "sbi",
    "apple", "microsoft", "google", "amazon", "tesla", "nvidia", "meta",
    "infy", "aapl", "msft", "tsla", "nvda", "amzn",
    # news-related finance terms
    "news", "latest", "headline", "update", "today", "recent",
    "announcement", "earnings report", "quarterly", "results",
}

_OFF_TOPIC_RESPONSE = (
    "I'm Finnie AI, a financial assistant. I can only help with finance-related topics "
    "such as stock prices, market analysis, portfolio management, investments, and economic insights. "
    "Please ask me something related to finance!"
)


def finance_guardrail_node(state: dict) -> dict:
    query = state["query"]
    q_lower = query.lower()

    # Fast path: keyword hit → pass immediately
    if any(kw in q_lower for kw in FINANCE_KEYWORDS):
        logger.info("[guardrail] passed via keyword match")
        return {**state, "guardrail_passed": True}

    # Slow path: ask LLM for ambiguous queries
    prompt = (
        "Is the following query related to finance, stocks, investments, markets, "
        "economy, banking, cryptocurrency, or any financial topic?\n"
        "Reply with only YES or NO.\n\n"
        f"Query: {query}"
    )
    try:
        verdict = _llm.generate_response(prompt).strip().upper()
        passed = verdict.startswith("YES")
        logger.info(f"[guardrail] LLM verdict={verdict!r} passed={passed}")
    except Exception as e:
        logger.warning(f"[guardrail] LLM check failed ({e}), defaulting to pass")
        passed = True

    return {**state, "guardrail_passed": passed}


def off_topic_node(state: dict) -> dict:
    logger.info("[guardrail] query rejected as off-topic")
    return {**state, "response": _OFF_TOPIC_RESPONSE, "intent": "off_topic"}
