from backend.Services.LLM import LLMService
import logging
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)
llm_service = LLMService(model="gpt-4o-mini")


def search_docs(query):
    """Mock search function that returns empty documents for now"""
    # TODO: Implement actual vector store search when data.txt is available
    return []


def ask_Rag(query):
    """Simple RAG implementation using LLM"""
    try:
        logger.debug(f"ask_Rag called with query: {query}")
        
        if query is None:
            logger.warning("Query is None, returning default message")
            return "Please provide a valid query"
        
        # For now, just use the LLM directly
        response = llm_service.generate_response(query)
        return response
    except Exception as e:
        logger.error(f"Error in ask_Rag: {str(e)}")
        return f"Error processing query: {str(e)}"