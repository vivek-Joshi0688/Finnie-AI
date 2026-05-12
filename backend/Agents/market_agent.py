import logging
import yfinance as yf
from backend.Services.LLM import LLMService

logger = logging.getLogger(__name__)

_llm = LLMService(model="gpt-4o-mini")

# Common stock name → Yahoo Finance ticker mapping
STOCK_MAP = {
    # Indian stocks (NSE)
    "TCS": "TCS.NS",           "TATA CONSULTANCY": "TCS.NS",
    "RELIANCE": "RELIANCE.NS", "RIL": "RELIANCE.NS",
    "INFOSYS": "INFY.NS",      "INFY": "INFY.NS",
    "WIPRO": "WIPRO.NS",
    "HDFC": "HDFCBANK.NS",     "HDFC BANK": "HDFCBANK.NS",
    "ICICI": "ICICIBANK.NS",   "ICICI BANK": "ICICIBANK.NS",
    "SBI": "SBIN.NS",          "STATE BANK": "SBIN.NS",
    "BAJAJ FINANCE": "BAJFINANCE.NS", "BAJAJ": "BAJFINANCE.NS",
    "AIRTEL": "BHARTIARTL.NS", "BHARTI AIRTEL": "BHARTIARTL.NS",
    "AXIS BANK": "AXISBANK.NS","AXIS": "AXISBANK.NS",
    "KOTAK BANK": "KOTAKBANK.NS","KOTAK": "KOTAKBANK.NS",
    "HCL TECH": "HCLTECH.NS",  "HCL": "HCLTECH.NS",
    "ITC": "ITC.NS",
    "ONGC": "ONGC.NS",
    "ADANI": "ADANIENT.NS",    "ADANI ENT": "ADANIENT.NS",
    "MARUTI SUZUKI": "MARUTI.NS","MARUTI": "MARUTI.NS",
    "TITAN": "TITAN.NS",
    "NIFTY 50": "^NSEI",       "NIFTY": "^NSEI",
    "SENSEX": "^BSESN",
    # US stocks
    "APPLE": "AAPL",   "AAPL": "AAPL",
    "MICROSOFT": "MSFT","MSFT": "MSFT",
    "GOOGLE": "GOOGL",  "ALPHABET": "GOOGL", "GOOGL": "GOOGL",
    "AMAZON": "AMZN",   "AMZN": "AMZN",
    "TESLA": "TSLA",    "TSLA": "TSLA",
    "META": "META",     "FACEBOOK": "META",
    "NVIDIA": "NVDA",   "NVDA": "NVDA",
    "NETFLIX": "NFLX",  "NFLX": "NFLX",
}


def _lookup_map(query: str):
    """Exact or substring match against the stock dictionary."""
    q = query.upper().strip()
    if q in STOCK_MAP:
        return STOCK_MAP[q]
    for name, ticker in STOCK_MAP.items():
        if name in q:
            return ticker
    return None


def extract_symbol(query: str) -> str:
    """
    Resolve ticker from a natural-language query.
    1. Fast: dictionary lookup (no API call needed).
    2. Fallback: ask the LLM.
    """
    mapped = _lookup_map(query)
    if mapped:
        logger.info(f"[market] symbol via dict: {mapped}")
        return mapped

    prompt = (
        "You are a stock ticker extractor. Extract the stock ticker symbol from the query.\n"
        "Rules:\n"
        "- Return ONLY the ticker symbol in UPPERCASE, nothing else.\n"
        "- For Indian stocks use Yahoo Finance NSE format, e.g. TCS.NS, RELIANCE.NS, INFY.NS\n"
        "- For US stocks use standard tickers, e.g. AAPL, MSFT, TSLA\n"
        "- If no specific stock is mentioned, return UNKNOWN\n\n"
        f"Query: {query}\n"
        "Ticker:"
    )
    try:
        raw = _llm.generate_response(prompt).strip()
        symbol = raw.split()[0].strip(".,!?\"'").upper()
        logger.info(f"[market] symbol via LLM: {symbol!r}")
        if symbol and symbol != "UNKNOWN":
            return symbol
    except Exception as e:
        logger.warning(f"[market] LLM extraction failed: {e}")

    # Last resort — longest capitalised word in the query
    words = [w.strip(".,!?\"'") for w in query.split() if len(w.strip(".,!?\"'")) > 1]
    fallback = max(words, key=len).upper() if words else "UNKNOWN"
    logger.warning(f"[market] fallback symbol: {fallback}")
    return fallback


def get_stock_price(symbol: str) -> dict:
    """Fetch the latest closing price via yfinance. Falls back to 1-month period if 5-day is empty."""
    logger.info(f"[market] fetching price for {symbol}")
    for period in ("5d", "1mo"):
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            if not hist.empty:
                price = round(float(hist["Close"].iloc[-1]), 2)
                date  = str(hist.index[-1].date())
                logger.info(f"[market] {symbol} = {price} ({date})")
                return {"symbol": symbol, "price": price, "date": date}
        except Exception as e:
            logger.warning(f"[market] yfinance period={period} failed for {symbol}: {e}")

    return {
        "error": (
            f"Could not retrieve price for '{symbol}'. "
            "Please try using the exact ticker symbol (e.g. TCS.NS for TCS on NSE, AAPL for Apple)."
        ),
        "symbol": symbol,
    }
