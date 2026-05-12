from fastapi import APIRouter
from backend.graph.graph_builder import build_graph

router = APIRouter()
graph  = build_graph()

# Human-readable labels for each graph node
NODE_LABELS = {
    "guardrail":  "Finance Guardrail",
    "off_topic":  "Off-topic Filter",
    "router":     "Intent Router",
    "market":     "Market Agent",
    "portfolio":  "Portfolio Agent",
    "rag":        "Knowledge Base",
    "news":       "News Agent",
    "aggregator": "Response Builder",
    "fallback":   "General AI",
}


def _step_detail(node: str, state: dict) -> str:
    """One-line summary of what a node did, derived from its output state."""
    if node == "guardrail":
        return "Finance query verified ✓" if state.get("guardrail_passed") else "Off-topic query blocked ✗"
    if node == "off_topic":
        return "Not finance-related — blocked"
    if node == "router":
        intent = (state.get("intent") or "unknown").capitalize()
        return f"Classified as → {intent}"
    if node == "market":
        data = state.get("data", {})
        if "price" in data:
            sym = data.get("symbol", "")
            price = data.get("price", 0)
            curr = "₹" if str(sym).endswith(".NS") else "$"
            return f"{sym} · {curr}{price:,.2f}"
        if "error" in data:
            return f"Could not fetch {data.get('symbol', '')}"
        return "Fetching live price…"
    if node == "portfolio":
        data = state.get("data", {})
        n = len(data.get("holdings", []))
        return f"{n} holdings with live prices" if n else "Portfolio loaded"
    if node == "news":
        data = state.get("data", {})
        n = data.get("count", 0)
        return f"{n} article{'s' if n != 1 else ''} fetched"
    if node == "rag":
        return "Searched knowledge base + web"
    if node == "aggregator":
        return "Formatting response…"
    if node == "fallback":
        return "Using general reasoning"
    return ""


@router.post("/")
def chat(query: str):
    """Chat endpoint — streams through the guardrail → finance graph, returns steps."""
    initial_state = {
        "query":            query,
        "intent":           None,
        "data":             {},
        "response":         None,
        "error":            None,
        "guardrail_passed": None,
    }

    steps       = []
    final_state = dict(initial_state)

    try:
        for event in graph.stream(
            initial_state,
            config={"run_name": "finnie-chat", "tags": ["finance", "production"]},
        ):
            for node_name, state_update in event.items():
                label  = NODE_LABELS.get(node_name, node_name)
                detail = _step_detail(node_name, state_update)
                steps.append({"node": node_name, "label": label, "detail": detail})
                final_state.update(state_update)

        return {
            "response":         final_state.get("response") or "No response generated",
            "data":             final_state.get("data", {}),
            "intent":           final_state.get("intent"),
            "guardrail_passed": final_state.get("guardrail_passed"),
            "steps":            steps,
        }
    except Exception as e:
        return {
            "response": f"Error processing query: {str(e)}",
            "error":    str(e),
            "steps":    steps,
        }
