import logging
from backend.Services.LLM import LLMService

logger = logging.getLogger(__name__)
llm_service = LLMService(model="gpt-4o-mini")


def _format_market_response(data: dict, query: str) -> str:
    """Format a stock price result directly — no LLM needed."""
    symbol = data.get("symbol", "")
    price  = data.get("price")
    date   = data.get("date", "")

    # Reverse-map ticker → friendly name for display
    TICKER_LABELS = {
        "TCS.NS": "TCS (Tata Consultancy Services)",
        "RELIANCE.NS": "Reliance Industries",
        "INFY.NS": "Infosys",
        "WIPRO.NS": "Wipro",
        "HDFCBANK.NS": "HDFC Bank",
        "ICICIBANK.NS": "ICICI Bank",
        "SBIN.NS": "State Bank of India",
        "BAJFINANCE.NS": "Bajaj Finance",
        "BHARTIARTL.NS": "Bharti Airtel",
        "AXISBANK.NS": "Axis Bank",
        "KOTAKBANK.NS": "Kotak Mahindra Bank",
        "HCLTECH.NS": "HCL Technologies",
        "ITC.NS": "ITC",
        "ONGC.NS": "ONGC",
        "ADANIENT.NS": "Adani Enterprises",
        "MARUTI.NS": "Maruti Suzuki",
        "TITAN.NS": "Titan",
        "^NSEI": "NIFTY 50",
        "^BSESN": "SENSEX",
        "AAPL": "Apple",
        "MSFT": "Microsoft",
        "GOOGL": "Alphabet (Google)",
        "AMZN": "Amazon",
        "TSLA": "Tesla",
        "META": "Meta",
        "NVDA": "NVIDIA",
        "NFLX": "Netflix",
    }
    label    = TICKER_LABELS.get(symbol, symbol)
    currency = "INR (₹)" if symbol.endswith(".NS") else "USD ($)"

    return (
        f"**{label}** — Latest closing price: **{price:,.2f} {currency}**\n"
        f"*(as of {date})*"
    )


def aggregator_node(state):
    if state.get("response"):
        return state

    data   = state.get("data") or {}
    query  = state.get("query", "")
    intent = state.get("intent", "")

    # ── Fast path: clean price data from market node ──────────────────────
    if intent == "market" and "price" in data and "error" not in data:
        response = _format_market_response(data, query)
        logger.info(f"[aggregator] fast-path price response for {data.get('symbol')}")
        return {**state, "response": response}

    # ── Error from market node ─────────────────────────────────────────────
    if "error" in data:
        err_msg = data["error"]
        symbol  = data.get("symbol", "")
        response = (
            f"I wasn't able to retrieve the price for **{symbol}**.\n\n"
            f"{err_msg}"
        )
        return {**state, "response": response}

    # ── Fast path: portfolio summary ──────────────────────────────────────
    if intent == "portfolio" and "holdings" in data:
        holdings    = data["holdings"]
        total_val   = data.get("total_value", 0)
        total_inv   = data.get("total_invested", 0)
        total_pnl   = data.get("total_pnl", 0)
        total_pct   = data.get("total_pnl_pct", 0)
        pnl_sign    = "+" if total_pnl >= 0 else ""
        pnl_color   = "profit" if total_pnl >= 0 else "loss"
        lines = [
            f"**Portfolio Summary** *(live prices)*\n",
            f"| Stock | Qty | Buy Price | Current | Value | P&L |",
            f"|-------|-----|-----------|---------|-------|-----|",
        ]
        for h in holdings:
            sign = "+" if h["pnl"] >= 0 else ""
            lines.append(
                f"| {h['name']} | {h['qty']} "
                f"| ₹{h['buy_price']:,.2f} "
                f"| ₹{h['current_price']:,.2f} "
                f"| ₹{h['current_value']:,.2f} "
                f"| {sign}₹{h['pnl']:,.2f} ({sign}{h['pnl_pct']}%) |"
            )
        lines.append(
            f"\n**Total Value:** ₹{total_val:,.2f} · "
            f"**Invested:** ₹{total_inv:,.2f} · "
            f"**Overall P&L:** {pnl_sign}₹{total_pnl:,.2f} ({pnl_sign}{total_pct}%)"
        )
        logger.info("[aggregator] fast-path portfolio summary")
        return {**state, "response": "\n".join(lines)}

    # ── Fast path: news articles ──────────────────────────────────────────
    if intent == "news" and "articles" in data:
        articles = data.get("articles", [])
        label    = data.get("label", "Finance News")
        if not articles:
            return {**state, "response": "No recent news articles found. Try a more specific query."}
        lines = [f"**{label}**\n"]
        for i, a in enumerate(articles[:6], 1):
            lines.append(f"{i}. [{a['title']}]({a['url']})")
            lines.append(f"   *{a['source']} · {a['time_ago']}*\n")
        logger.info(f"[aggregator] fast-path news: {len(articles)} articles")
        return {**state, "response": "\n".join(lines)}

    # ── LLM path: RAG / complex queries ───────────────────────────────────
    prompt = (
        "You are Finnie AI, a financial assistant. "
        "Answer the user's finance query using ONLY the data provided below. "
        "Do NOT say data is unavailable if data is present. "
        "Be concise and factual.\n\n"
        f"Query: {query}\n"
        f"Data: {data}\n\n"
        "Response:"
    )
    try:
        final = llm_service.generate_response(prompt)
        return {**state, "response": final}
    except Exception as e:
        logger.error(f"[aggregator] LLM failed: {e}")
        return {**state, "error": str(e)}
