from langgraph.graph import StateGraph, END

from backend.graph.state import GraphState
from backend.graph.guardrail import finance_guardrail_node, off_topic_node
from backend.graph.router import router_node
from backend.graph.nodes.market_node import market_node
from backend.graph.nodes.portfolio_node import portfolio_node
from backend.graph.nodes.rag_node import rag_node
from backend.graph.nodes.news_node import news_node
from backend.graph.aggregator import aggregator_node
from backend.graph.fallback import fallback_node


def build_graph():
    builder = StateGraph(GraphState)

    # --- Nodes ---
    builder.add_node("guardrail",  finance_guardrail_node)
    builder.add_node("off_topic",  off_topic_node)
    builder.add_node("router",     router_node)
    builder.add_node("market",     market_node)
    builder.add_node("portfolio",  portfolio_node)
    builder.add_node("rag",        rag_node)
    builder.add_node("news",       news_node)
    builder.add_node("aggregator", aggregator_node)
    builder.add_node("fallback",   fallback_node)

    # --- Entry point ---
    builder.set_entry_point("guardrail")

    def guardrail_route(state):
        return "router" if state.get("guardrail_passed") else "off_topic"

    builder.add_conditional_edges("guardrail", guardrail_route, {
        "router":    "router",
        "off_topic": "off_topic",
    })

    def intent_route(state):
        intent = state.get("intent", "").lower()
        if intent == "market":     return "market"
        if intent == "portfolio":  return "portfolio"
        if intent == "knowledge":  return "rag"
        if intent == "news":       return "news"
        return "fallback"

    builder.add_conditional_edges("router", intent_route, {
        "market":    "market",
        "portfolio": "portfolio",
        "rag":       "rag",
        "news":      "news",
        "fallback":  "fallback",
    })

    # Domain nodes → aggregator
    builder.add_edge("market",    "aggregator")
    builder.add_edge("portfolio", "aggregator")
    builder.add_edge("rag",       "aggregator")
    builder.add_edge("news",      "aggregator")

    # Terminal edges
    builder.add_edge("aggregator", END)
    builder.add_edge("fallback",   END)
    builder.add_edge("off_topic",  END)

    return builder.compile()
