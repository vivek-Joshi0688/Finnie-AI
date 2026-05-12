from backend.Agents.portfolio_agent import analyze_portfolio


def portfolio_node(state):
    try:
        result = analyze_portfolio(state.get("query", ""))
        return {**state, "data": result}
    except Exception as e:
        return {**state, "data": {"error": str(e)}}
