from backend.Services.LLM import LLMService

llm_service = LLMService(model="gpt-4o-mini")


def router_node(state):
    query = state["query"]

    prompt = (
        "Classify the query into exactly one of: market, portfolio, knowledge, news\n\n"
        "- market:    stock prices, indices, trading, price of a specific stock\n"
        "- portfolio: user holdings, gains/losses, portfolio value, my stocks\n"
        "- knowledge: financial concepts, how-to, explanations, definitions\n"
        "- news:      latest news, headlines, updates, recent events, what happened\n\n"
        f"Query: {query}\n"
        "Reply with only the category word."
    )

    try:
        intent = llm_service.generate_response(prompt).strip().lower()
        if intent not in ("market", "portfolio", "knowledge", "news"):
            intent = "knowledge"
        return {**state, "intent": intent}
    except Exception as e:
        return {**state, "intent": "knowledge", "error": str(e)}
