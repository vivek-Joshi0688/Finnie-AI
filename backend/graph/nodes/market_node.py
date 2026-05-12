from backend.Agents.market_agent import extract_symbol, get_stock_price


def market_node(state):
    try:
        symbol = extract_symbol(state["query"])
        result = get_stock_price(symbol)
        return {**state, "data": result}
    except Exception as e:
        return {**state, "data": {"error": str(e)}}
