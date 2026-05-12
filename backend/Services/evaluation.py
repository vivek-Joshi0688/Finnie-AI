"""
LangSmith evaluation for Finnie AI finance responses.

Usage (run once to seed dataset, then evaluate):
    python -m backend.Services.evaluation

Requires env vars:
    LANGCHAIN_API_KEY   — LangSmith API key
    LANGCHAIN_PROJECT   — project name (e.g. finnie-ai)
    OPENAI_API_KEY      — used by LLM evaluators
"""
import logging
import os
from typing import Any

from dotenv import load_dotenv, find_dotenv
from langsmith import Client, evaluate
from langsmith.schemas import Run, Example

from backend.Services.LLM import LLMService

load_dotenv(find_dotenv())
logger = logging.getLogger(__name__)

_llm = LLMService(model="gpt-4o-mini")

DATASET_NAME = "finnie-finance-eval-v1"

# ---------------------------------------------------------------------------
# Sample finance Q&A dataset
# ---------------------------------------------------------------------------
SAMPLE_EXAMPLES = [
    {
        "input":  {"query": "What is the current price of TCS stock?"},
        "output": {"criteria": "Response should mention TCS stock price in INR and the date of the quote."},
    },
    {
        "input":  {"query": "How is NIFTY 50 performing today?"},
        "output": {"criteria": "Response should include NIFTY 50 index value and direction (up/down)."},
    },
    {
        "input":  {"query": "Explain what a mutual fund is."},
        "output": {"criteria": "Response should define mutual fund and mention pooling, NAV, or diversification."},
    },
    {
        "input":  {"query": "What is inflation and how does it affect investments?"},
        "output": {"criteria": "Response should define inflation and explain its impact on purchasing power or real returns."},
    },
    {
        "input":  {"query": "Give me a brief analysis of Reliance Industries stock."},
        "output": {"criteria": "Response should mention Reliance stock performance, price, or key financial metrics."},
    },
    {
        "input":  {"query": "What is a P/E ratio and why does it matter?"},
        "output": {"criteria": "Response should explain Price-to-Earnings ratio and its use in stock valuation."},
    },
    {
        "input":  {"query": "Should I invest in gold or equities right now?"},
        "output": {"criteria": "Response should discuss risk-return trade-off of gold vs equities."},
    },
    {
        "input":  {"query": "What is the difference between NSE and BSE?"},
        "output": {"criteria": "Response should differentiate National Stock Exchange and Bombay Stock Exchange."},
    },
]


# ---------------------------------------------------------------------------
# Evaluators
# ---------------------------------------------------------------------------

def finance_relevance_evaluator(run: Run, example: Example) -> dict:
    """Checks whether the response is relevant to the finance query."""
    query    = (example.inputs or {}).get("query", "")
    response = (run.outputs or {}).get("response", "")

    if not response:
        return {"key": "finance_relevance", "score": 0, "comment": "Empty response"}

    prompt = (
        "You are evaluating a financial AI assistant.\n"
        f"User query: {query}\n"
        f"Assistant response: {response}\n\n"
        "Is this response relevant to the finance query? "
        "Score 1 if relevant, 0 if not. Reply ONLY with 1 or 0."
    )
    try:
        verdict = _llm.generate_response(prompt).strip()
        score = 1 if verdict.startswith("1") else 0
    except Exception as e:
        logger.warning(f"[eval] finance_relevance LLM failed: {e}")
        score = 0

    return {"key": "finance_relevance", "score": score}


def response_completeness_evaluator(run: Run, example: Example) -> dict:
    """Checks whether the response adequately answers the query."""
    query    = (example.inputs or {}).get("query", "")
    criteria = (example.outputs or {}).get("criteria", "")
    response = (run.outputs or {}).get("response", "")

    if not response:
        return {"key": "response_completeness", "score": 0, "comment": "Empty response"}

    prompt = (
        "You are a strict evaluator for a financial AI assistant.\n"
        f"Query: {query}\n"
        f"Expected criteria: {criteria}\n"
        f"Actual response: {response}\n\n"
        "Does the response satisfy the expected criteria? "
        "Score 1 if yes, 0 if no. Reply ONLY with 1 or 0."
    )
    try:
        verdict = _llm.generate_response(prompt).strip()
        score = 1 if verdict.startswith("1") else 0
    except Exception as e:
        logger.warning(f"[eval] completeness LLM failed: {e}")
        score = 0

    return {"key": "response_completeness", "score": score}


def no_hallucination_evaluator(run: Run, example: Example) -> dict:
    """Checks whether the response contains obvious hallucinations or fabricated numbers."""
    query    = (example.inputs or {}).get("query", "")
    response = (run.outputs or {}).get("response", "")

    if not response:
        return {"key": "no_hallucination", "score": 0, "comment": "Empty response"}

    prompt = (
        "You are evaluating a financial AI assistant for factual honesty.\n"
        f"Query: {query}\n"
        f"Response: {response}\n\n"
        "Does the response avoid making up specific financial figures or facts "
        "that cannot be verified? (It is OK to say data is unavailable.)\n"
        "Score 1 if the response is honest and grounded, 0 if it likely hallucinates. "
        "Reply ONLY with 1 or 0."
    )
    try:
        verdict = _llm.generate_response(prompt).strip()
        score = 1 if verdict.startswith("1") else 0
    except Exception as e:
        logger.warning(f"[eval] hallucination LLM failed: {e}")
        score = 0

    return {"key": "no_hallucination", "score": score}


EVALUATORS = [
    finance_relevance_evaluator,
    response_completeness_evaluator,
    no_hallucination_evaluator,
]


# ---------------------------------------------------------------------------
# Dataset helpers
# ---------------------------------------------------------------------------

def get_or_create_dataset(client: Client) -> Any:
    """Return existing dataset or create and seed a new one."""
    existing = [d for d in client.list_datasets() if d.name == DATASET_NAME]
    if existing:
        logger.info(f"[eval] using existing dataset: {DATASET_NAME}")
        return existing[0]

    logger.info(f"[eval] creating dataset: {DATASET_NAME}")
    dataset = client.create_dataset(
        DATASET_NAME,
        description="Finance Q&A evaluation set for Finnie AI",
    )
    client.create_examples(
        inputs=[ex["input"] for ex in SAMPLE_EXAMPLES],
        outputs=[ex["output"] for ex in SAMPLE_EXAMPLES],
        dataset_id=dataset.id,
    )
    logger.info(f"[eval] seeded {len(SAMPLE_EXAMPLES)} examples")
    return dataset


# ---------------------------------------------------------------------------
# Main evaluation runner
# ---------------------------------------------------------------------------

def run_finance_evaluation(target_fn=None):
    """
    Run LangSmith evaluation against the finance dataset.

    Args:
        target_fn: Callable that accepts {"query": str} and returns {"response": str}.
                   Defaults to the live Finnie AI graph.
    """
    api_key = os.getenv("LANGCHAIN_API_KEY")
    if not api_key:
        raise EnvironmentError("LANGCHAIN_API_KEY is not set. Cannot run LangSmith evaluation.")

    if target_fn is None:
        from backend.graph.graph_builder import build_graph
        _graph = build_graph()

        def target_fn(inputs: dict) -> dict:
            state = {
                "query":   inputs["query"],
                "intent":  None,
                "data":    {},
                "response": None,
                "error":   None,
                "guardrail_passed": None,
            }
            result = _graph.invoke(state)
            return {"response": result.get("response", "")}

    client  = get_or_create_dataset.__globals__["Client"]()
    dataset = get_or_create_dataset(client)

    logger.info("[eval] starting evaluation run…")
    results = evaluate(
        target_fn,
        data=dataset.name,
        evaluators=EVALUATORS,
        experiment_prefix="finnie-ai",
        metadata={"model": "gpt-4o-mini", "graph": "finnie-langgraph"},
    )
    logger.info("[eval] done")
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = run_finance_evaluation()
    print(results)
