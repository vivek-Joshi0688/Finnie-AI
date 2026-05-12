from fastapi import APIRouter
from backend.Agents.portfolio_agent import get_live_portfolio

router = APIRouter()


@router.get("/")
def portfolio():
    """Return live portfolio with real-time prices and P&L for all holdings."""
    return get_live_portfolio()
