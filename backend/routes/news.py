from fastapi import APIRouter, Query
from backend.Agents.news_agent import fetch_news

router = APIRouter()


@router.get("/")
def news(query: str = Query(default="", description="Stock name, ticker, or finance topic")):
    """Return live finance news. Pass ?query=TCS for stock-specific news."""
    return fetch_news(query)
