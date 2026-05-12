from backend.Agents.rag_agent import rag_answer


def rag_node(state):
    try:
        result = rag_answer(state["query"])
        return {**state, "data": result}
    except Exception as e:
        return {**state, "error": str(e)}