import logging
from backend.Agents.market_agent import get_stock_price

logger = logging.getLogger(__name__)

# Edit this to match your actual holdings
PORTFOLIO = {
    "RELIANCE.NS":  {"name": "Reliance Industries", "qty": 10, "buy_price": 2400.00},
    "TCS.NS":       {"name": "TCS",                 "qty":  5, "buy_price": 3200.00},
    "INFY.NS":      {"name": "Infosys",             "qty":  8, "buy_price": 1400.00},
    "HDFCBANK.NS":  {"name": "HDFC Bank",           "qty": 15, "buy_price": 1500.00},
    "ICICIBANK.NS": {"name": "ICICI Bank",          "qty": 12, "buy_price":  950.00},
}


def get_live_portfolio() -> dict:
    """Fetch live prices for every holding and compute full P&L breakdown."""
    holdings       = []
    total_invested = 0.0
    total_current  = 0.0

    for symbol, meta in PORTFOLIO.items():
        price_data = get_stock_price(symbol)

        if "error" in price_data:
            logger.warning(f"[portfolio] price fetch failed for {symbol}: {price_data['error']}")
            current_price = meta["buy_price"]   # graceful fallback to buy price
            price_date    = "unavailable"
            live          = False
        else:
            current_price = price_data["price"]
            price_date    = price_data["date"]
            live          = True

        qty           = meta["qty"]
        buy_price     = meta["buy_price"]
        invested      = round(qty * buy_price, 2)
        current_value = round(qty * current_price, 2)
        pnl           = round(current_value - invested, 2)
        pnl_pct       = round((pnl / invested) * 100, 2) if invested else 0.0

        total_invested += invested
        total_current  += current_value

        holdings.append({
            "symbol":        symbol,
            "name":          meta["name"],
            "qty":           qty,
            "buy_price":     buy_price,
            "current_price": current_price,
            "current_value": current_value,
            "invested":      invested,
            "pnl":           pnl,
            "pnl_pct":       pnl_pct,
            "price_date":    price_date,
            "live":          live,
        })

    total_pnl     = round(total_current - total_invested, 2)
    total_pnl_pct = round((total_pnl / total_invested) * 100, 2) if total_invested else 0.0

    return {
        "holdings":       holdings,
        "total_invested": round(total_invested, 2),
        "total_value":    round(total_current, 2),
        "total_pnl":      total_pnl,
        "total_pnl_pct":  total_pnl_pct,
    }


def analyze_portfolio(query: str = "") -> dict:
    """Entry point called by the portfolio graph node."""
    logger.info(f"[portfolio] query: {query!r}")
    return get_live_portfolio()
