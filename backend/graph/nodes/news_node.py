from backend.Agents.news_agent import fetch_news


def news_node(state):
    try:
        result = fetch_news(state.get("query", ""))
        return {**state, "data": result}
    except Exception as e:
        return {**state, "data": {"error": str(e), "articles": [], "count": 0}}
