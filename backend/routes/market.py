import logging
import yfinance as yf
import pandas as pd
from fastapi import APIRouter, Query

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Symbols ───────────────────────────────────────────────────────────────────

INDEX_META = [
    {"symbol": "^NSEI",    "name": "NIFTY 50"},
    {"symbol": "^BSESN",   "name": "SENSEX"},
    {"symbol": "^NSEBANK", "name": "BANK NIFTY"},
]

MOVER_META = {
    "TCS.NS":       "TCS",
    "RELIANCE.NS":  "Reliance",
    "INFY.NS":      "Infosys",
    "HDFCBANK.NS":  "HDFC Bank",
    "ICICIBANK.NS": "ICICI Bank",
    "WIPRO.NS":     "Wipro",
    "KOTAKBANK.NS": "Kotak Bank",
    "AXISBANK.NS":  "Axis Bank",
    "MARUTI.NS":    "Maruti",
    "ITC.NS":       "ITC",
    "ADANIENT.NS":  "Adani Ent",
    "TITAN.NS":     "Titan",
}

PERIOD_MAP = {"1W": "5d", "1M": "1mo", "3M": "3mo", "6M": "6mo"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_download(symbols: list, period: str) -> pd.DataFrame:
    """Batch download closing prices; return empty DataFrame on failure."""
    try:
        raw = yf.download(
            symbols, period=period,
            auto_adjust=True, progress=False, threads=True,
        )
        if isinstance(raw.columns, pd.MultiIndex):
            close = raw["Close"]
        else:
            close = raw[["Close"]] if "Close" in raw.columns else pd.DataFrame()
        return close.dropna(how="all")
    except Exception as e:
        logger.warning(f"[market] batch download failed: {e}")
        return pd.DataFrame()


def _index_card(name: str, series: pd.Series) -> dict | None:
    series = series.dropna()
    if len(series) < 2:
        return None
    current  = float(series.iloc[-1])
    prev     = float(series.iloc[-2])
    change   = current - prev
    chg_pct  = (change / prev) * 100 if prev else 0
    return {
        "name":       name,
        "value":      round(current, 2),
        "change":     round(change, 2),
        "change_pct": round(chg_pct, 2),
        "up":         change >= 0,
    }


def _mover_card(symbol: str, name: str, series: pd.Series) -> dict | None:
    series = series.dropna()
    if len(series) < 2:
        return None
    current = float(series.iloc[-1])
    prev    = float(series.iloc[-2])
    chg_pct = ((current - prev) / prev) * 100 if prev else 0
    return {
        "symbol":     symbol,
        "name":       name,
        "price":      round(current, 2),
        "change_pct": round(chg_pct, 2),
        "up":         chg_pct >= 0,
    }


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/trends")
def market_trends(period: str = Query(default="1M", description="1W | 1M | 3M | 6M")):
    """Return live index values, historical chart data, and top movers."""
    yf_period = PERIOD_MAP.get(period.upper(), "1mo")

    all_symbols = [m["symbol"] for m in INDEX_META] + list(MOVER_META.keys())
    close       = _safe_download(all_symbols, yf_period)

    # ── Index cards ──────────────────────────────────────────────────────────
    indices = []
    for meta in INDEX_META:
        sym = meta["symbol"]
        if sym in close.columns:
            card = _index_card(meta["name"], close[sym])
            if card:
                indices.append(card)

    # ── Chart data (NIFTY 50 + SENSEX, normalised to % from first value) ────
    chart_raw = []
    nifty_col  = "^NSEI"
    sensex_col = "^BSESN"

    if nifty_col in close.columns:
        nifty_s  = close[nifty_col].dropna()
        sensex_s = close[sensex_col].dropna() if sensex_col in close.columns else pd.Series(dtype=float)

        # Use shared date range
        dates = nifty_s.index
        n0    = float(nifty_s.iloc[0])
        s0    = float(sensex_s.iloc[0]) if not sensex_s.empty else None

        for date in dates:
            label = date.strftime("%d %b").lstrip("0") if hasattr(date, "strftime") else str(date)[:10]
            entry: dict = {
                "date":  label,
                "NIFTY": round(float(nifty_s[date]), 2),
                "NIFTY_pct": round((float(nifty_s[date]) - n0) / n0 * 100, 3),
            }
            if s0 and date in sensex_s.index:
                entry["SENSEX"]     = round(float(sensex_s[date]), 2)
                entry["SENSEX_pct"] = round((float(sensex_s[date]) - s0) / s0 * 100, 3)
            chart_raw.append(entry)

    # ── Top movers ────────────────────────────────────────────────────────────
    movers = []
    for sym, name in MOVER_META.items():
        if sym in close.columns:
            card = _mover_card(sym, name, close[sym])
            if card:
                movers.append(card)

    movers_sorted = sorted(movers, key=lambda x: x["change_pct"], reverse=True)
    gainers = [m for m in movers_sorted if m["change_pct"] > 0][:5]
    losers  = [m for m in reversed(movers_sorted) if m["change_pct"] < 0][:5]
    # Fallback when everything moves the same direction
    if not gainers: gainers = movers_sorted[:3]
    if not losers:  losers  = list(reversed(movers_sorted))[:3]

    logger.info(f"[market] trends fetched: {len(indices)} indices, {len(chart_raw)} chart pts, {len(movers)} movers")

    return {
        "indices": indices,
        "chart":   chart_raw,
        "gainers": gainers,
        "losers":  losers,
        "period":  period.upper(),
    }
