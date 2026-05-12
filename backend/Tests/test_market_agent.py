"""
Tests for backend.Agents.market_agent
Run: python -m pytest backend/Tests/test_market_agent.py -v
"""
import pytest
from unittest.mock import patch, MagicMock
import pandas as pd

from backend.Agents.market_agent import (
    extract_symbol,
    get_stock_price,
    _lookup_map,
    STOCK_MAP,
)


# ─────────────────────────────────────────────────────────────────────────────
# _lookup_map
# ─────────────────────────────────────────────────────────────────────────────

class TestLookupMap:
    def test_exact_match_indian(self):
        assert _lookup_map("TCS") == "TCS.NS"

    def test_exact_match_us(self):
        assert _lookup_map("APPLE") == "AAPL"

    def test_case_insensitive(self):
        assert _lookup_map("tcs") == "TCS.NS"
        assert _lookup_map("apple") == "AAPL"

    def test_substring_match(self):
        # "TATA CONSULTANCY" is a substring key → TCS.NS
        assert _lookup_map("Tell me about TATA CONSULTANCY stock") == "TCS.NS"

    def test_no_match_returns_none(self):
        assert _lookup_map("randomxyz123") is None

    def test_index_nifty(self):
        assert _lookup_map("NIFTY") == "^NSEI"
        assert _lookup_map("NIFTY 50") == "^NSEI"

    def test_sensex(self):
        assert _lookup_map("SENSEX") == "^BSESN"

    def test_all_keys_present(self):
        # Spot-check a few to ensure STOCK_MAP wasn't accidentally cleared
        for key in ("RELIANCE", "INFOSYS", "HDFC BANK", "NVIDIA", "TESLA"):
            assert key in STOCK_MAP, f"{key} missing from STOCK_MAP"


# ─────────────────────────────────────────────────────────────────────────────
# extract_symbol
# ─────────────────────────────────────────────────────────────────────────────

class TestExtractSymbol:
    # --- dict fast-path (no LLM call) ---

    def test_indian_stock_by_name(self):
        assert extract_symbol("What is TCS stock price?") == "TCS.NS"

    def test_indian_stock_alias(self):
        assert extract_symbol("How is Reliance doing today?") == "RELIANCE.NS"

    def test_us_stock_by_name(self):
        assert extract_symbol("Show me Apple stock") == "AAPL"

    def test_us_stock_ticker(self):
        assert extract_symbol("TSLA price please") == "TSLA"

    def test_nvidia(self):
        assert extract_symbol("nvidia share price") == "NVDA"

    def test_index_nifty(self):
        assert extract_symbol("How is NIFTY 50 today?") == "^NSEI"

    # --- LLM fallback path ---

    @patch("backend.Agents.market_agent._llm")
    def test_llm_fallback_called_for_unknown(self, mock_llm):
        mock_llm.generate_response.return_value = "HDFC.NS"
        result = extract_symbol("Tell me about home loans from housing finance company")
        # LLM should have been called because no keyword matched
        mock_llm.generate_response.assert_called_once()
        assert result == "HDFC.NS"

    @patch("backend.Agents.market_agent._llm")
    def test_llm_returns_unknown_falls_to_longest_word(self, mock_llm):
        mock_llm.generate_response.return_value = "UNKNOWN"
        result = extract_symbol("Some random query about xyz corp")
        assert result != ""   # must return something

    @patch("backend.Agents.market_agent._llm")
    def test_llm_exception_falls_to_longest_word(self, mock_llm):
        mock_llm.generate_response.side_effect = RuntimeError("API down")
        result = extract_symbol("ZOMATO stock analysis please")
        assert isinstance(result, str)
        assert len(result) > 0


# ─────────────────────────────────────────────────────────────────────────────
# get_stock_price
# ─────────────────────────────────────────────────────────────────────────────

def _make_hist(price: float, date: str = "2026-04-24"):
    """Build a minimal yfinance-style history DataFrame."""
    idx = pd.to_datetime([date], utc=True).tz_convert("Asia/Kolkata")
    return pd.DataFrame({"Close": [price]}, index=idx)


class TestGetStockPrice:
    # --- happy path ---

    @patch("backend.Agents.market_agent.yf.Ticker")
    def test_returns_price_on_5d(self, mock_ticker_cls):
        mock_ticker = MagicMock()
        mock_ticker.history.return_value = _make_hist(1154.60)
        mock_ticker_cls.return_value = mock_ticker

        result = get_stock_price("INFY.NS")

        assert result["symbol"] == "INFY.NS"
        assert result["price"] == 1154.60
        assert "date" in result
        assert "error" not in result

    @patch("backend.Agents.market_agent.yf.Ticker")
    def test_returns_price_for_us_stock(self, mock_ticker_cls):
        mock_ticker = MagicMock()
        mock_ticker.history.return_value = _make_hist(213.45, "2026-04-24")
        mock_ticker_cls.return_value = mock_ticker

        result = get_stock_price("AAPL")

        assert result["symbol"] == "AAPL"
        assert result["price"] == 213.45

    @patch("backend.Agents.market_agent.yf.Ticker")
    def test_price_is_rounded_to_2dp(self, mock_ticker_cls):
        mock_ticker = MagicMock()
        mock_ticker.history.return_value = _make_hist(1154.6789)
        mock_ticker_cls.return_value = mock_ticker

        result = get_stock_price("INFY.NS")
        assert result["price"] == 1154.68

    # --- fallback to 1mo when 5d is empty ---

    @patch("backend.Agents.market_agent.yf.Ticker")
    def test_falls_back_to_1mo_when_5d_empty(self, mock_ticker_cls):
        mock_ticker = MagicMock()
        mock_ticker.history.side_effect = [
            pd.DataFrame(),               # 5d → empty
            _make_hist(3500.0),           # 1mo → has data
        ]
        mock_ticker_cls.return_value = mock_ticker

        result = get_stock_price("RELIANCE.NS")

        assert result["price"] == 3500.0
        assert "error" not in result
        assert mock_ticker.history.call_count == 2

    # --- error path ---

    @patch("backend.Agents.market_agent.yf.Ticker")
    def test_returns_error_dict_when_both_periods_empty(self, mock_ticker_cls):
        mock_ticker = MagicMock()
        mock_ticker.history.return_value = pd.DataFrame()  # always empty
        mock_ticker_cls.return_value = mock_ticker

        result = get_stock_price("BADTICKER")

        assert "error" in result
        assert result["symbol"] == "BADTICKER"
        assert "BADTICKER" in result["error"]

    @patch("backend.Agents.market_agent.yf.Ticker")
    def test_returns_error_dict_on_exception(self, mock_ticker_cls):
        mock_ticker = MagicMock()
        mock_ticker.history.side_effect = Exception("network error")
        mock_ticker_cls.return_value = mock_ticker

        result = get_stock_price("INFY.NS")

        assert "error" in result
        assert result["symbol"] == "INFY.NS"

    @patch("backend.Agents.market_agent.yf.Ticker")
    def test_error_message_contains_ticker_hint(self, mock_ticker_cls):
        mock_ticker = MagicMock()
        mock_ticker.history.return_value = pd.DataFrame()
        mock_ticker_cls.return_value = mock_ticker

        result = get_stock_price("UNKNOWN_XYZ")
        # Error message should guide the user
        assert "TCS.NS" in result["error"] or "AAPL" in result["error"]


# ─────────────────────────────────────────────────────────────────────────────
# Integration: extract_symbol → get_stock_price (live, skipped in CI)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.integration
class TestLiveMarketAgent:
    """
    Live network tests — skipped by default.
    Run with: pytest -m integration -v
    """

    KNOWN_STOCKS = [
        ("What is TCS stock price?",     "TCS.NS"),
        ("Show me Infosys share price",  "INFY.NS"),
        ("AAPL price",                   "AAPL"),
        ("How is NIFTY performing?",     "^NSEI"),
    ]

    @pytest.mark.parametrize("query,expected_symbol", KNOWN_STOCKS)
    def test_symbol_extraction(self, query, expected_symbol):
        assert extract_symbol(query) == expected_symbol

    @pytest.mark.parametrize("symbol", ["TCS.NS", "INFY.NS", "RELIANCE.NS", "AAPL"])
    def test_live_price_fetch(self, symbol):
        result = get_stock_price(symbol)
        assert "price" in result, f"No price for {symbol}: {result}"
        assert isinstance(result["price"], float)
        assert result["price"] > 0
        assert "date" in result
