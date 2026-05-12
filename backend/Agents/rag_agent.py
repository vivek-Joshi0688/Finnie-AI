import logging
from backend.Services.RAG import search_docs
from backend.Services.tavily_search import tavily_search
from backend.Services.LLM import LLMService

logger = logging.getLogger(__name__)
llm_service = LLMService(model="gpt-4o-mini")

# Trigger web search when vector store returns fewer than this many docs
MIN_VECTOR_DOCS = 2


def rag_answer(query: str) -> str:
    # ── 1. Local vector store ─────────────────────────────────────────────
    docs = search_docs(query)
    vector_context = "\n".join(doc.page_content for doc in docs)
    logger.info(f"[rag] vector store returned {len(docs)} doc(s)")

    # ── 2. Tavily web search fallback ─────────────────────────────────────
    web_context = ""
    if len(docs) < MIN_VECTOR_DOCS:
        logger.info("[rag] sparse local context — fetching from Tavily")
        web_context = tavily_search(query)

    # ── 3. Assemble context block ─────────────────────────────────────────
    parts = []
    if vector_context.strip():
        parts.append(f"[Local Knowledge Base]\n{vector_context}")
    if web_context.strip():
        parts.append(f"[Web Search Results]\n{web_context}")

    if not parts:
        context = "No relevant context found."
        logger.warning("[rag] both vector store and web search returned nothing")
    else:
        context = "\n\n---\n\n".join(parts)

    # ── 4. LLM response ───────────────────────────────────────────────────
    prompt = (
        "You are Finnie AI, a financial assistant.\n"
        "Answer the question using ONLY the context below.\n"
        "When using web results, cite the source URL inline (e.g. [source]).\n"
        "If the context is insufficient, say so clearly.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {query}\n\n"
        "Answer:"
    )
    return llm_service.generate_response(prompt)
