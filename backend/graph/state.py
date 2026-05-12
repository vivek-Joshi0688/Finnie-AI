from typing import TypedDict, Optional, Dict, Any


class GraphState(TypedDict):
    query: str
    intent: Optional[str]
    data: Dict[str, Any]
    response: Optional[str]
    error: Optional[str]
    guardrail_passed: Optional[bool]

   