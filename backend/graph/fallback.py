from backend.Services.LLM import LLMService

llm_service = LLMService(model="gpt-4o-mini")

def fallback_node(state):
    try:
        response = llm_service.generate_response(state["query"])
        return {**state, "response": response}
    except:
        return {**state, "response": "System temporarily unavailable"}