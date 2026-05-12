# Finnie AI — Financial Assistant

Finnie AI is a full-stack financial assistant powered by a multi-agent LangGraph pipeline and a React frontend. It answers questions about stock prices, portfolios, financial news, and general finance concepts using real-time data from yfinance and Tavily.

---

## Features

- **Multi-Agent Chat** — Queries are routed through specialized agents (market, portfolio, news, knowledge) via a LangGraph state machine
- **Finance Guardrail** — Off-topic queries are filtered before reaching any agent
- **Live Market Data** — Stock prices and indices fetched in real-time via yfinance
- **Portfolio Tracking** — Holdings with live P&L calculations
- **News Feed** — Finance headlines from curated sources (Bloomberg, Reuters, MoneyControl, etc.)
- **RAG Knowledge Base** — Answers finance questions using vector search + web search fallback
- **Step Visualization** — Frontend shows which agents ran and what they did
- **Dark / Light Mode** — Theme toggle with system preference detection
- **Conversation History** — Chat sessions persisted in localStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI + Uvicorn |
| AI Orchestration | LangGraph + LangChain |
| LLM | OpenAI GPT-4 / GPT-4o-mini |
| Vector Store | FAISS |
| Market Data | yfinance |
| Web Search | Tavily |
| Observability | LangSmith |
| Frontend | React 19, React Router 7 |
| UI | Material-UI (MUI), Tailwind CSS |
| Charts | Recharts |
| HTTP Client | Axios |

---

## Project Structure

```
Finnie-AI/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── Agents/
│   │   ├── market_agent.py      # Stock price extraction & lookup
│   │   ├── portfolio_agent.py   # P&L calculations
│   │   ├── news_agent.py        # Finance news fetching
│   │   └── rag_agent.py         # RAG-based Q&A
│   ├── Services/
│   │   ├── LLM.py               # OpenAI client setup
│   │   ├── RAG.py               # Vector store + web search
│   │   ├── tavily_search.py     # Tavily API wrapper
│   │   ├── vector_store.py      # FAISS vector database
│   │   └── evaluation.py        # LangSmith evaluation
│   ├── graph/
│   │   ├── state.py             # GraphState definition
│   │   ├── graph_builder.py     # LangGraph architecture
│   │   ├── guardrail.py         # Finance query validation
│   │   ├── router.py            # Intent classification
│   │   ├── aggregator.py        # Response formatting
│   │   ├── fallback.py          # Generic fallback handler
│   │   └── nodes/               # Per-agent graph nodes
│   └── routes/
│       ├── chat.py              # POST /chat/
│       ├── market.py            # GET /market/trends
│       ├── portfolio.py         # GET /portfolio/
│       └── news.py              # GET /news/
├── frontend/
│   └── src/
│       ├── Pages/               # ChatPage, MarketPage, PortfolioPage, NewsPage
│       ├── components/          # ChatBox, ChatSidebar, Navbar, Message, AgentBadge
│       ├── context/             # ThemeContext
│       └── hooks/               # useChatHistory
├── requirements.txt
└── pytest.ini
```

---

## Agent Pipeline

```
User Query
    │
    ▼
Guardrail  ──(off-topic)──▶  END
    │
    ▼
Router  ──▶  market | portfolio | knowledge | news
    │
    ▼
Agent Node  (fetches live data)
    │
    ▼
Aggregator  (formats response via fast-path or LLM)
    │
    ▼
Response
```

---

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- An [OpenAI API key](https://platform.openai.com/api-keys)
- (Optional) A [Tavily API key](https://www.tavily.com/) for enhanced web search

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Finnie-AI.git
cd Finnie-AI
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-your-openai-key
TAVILY_API_KEY=tvly-your-tavily-key     # optional
AlphaVantage_API_KEY=demo               # optional, for /stock endpoint
```

### 3. Set up the backend

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate       # macOS/Linux
.venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive API docs: `http://localhost:8000/docs`

### 4. Set up the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

---

## API Reference

### `POST /chat/`

Main conversational endpoint. Runs the full LangGraph pipeline.

**Request**
```json
{ "query": "What is the current price of TCS?" }
```

**Response**
```json
{
  "response": "**TCS** — Latest closing price: **₹3,200.00 INR** *(as of 2026-05-12)*",
  "data": { ... },
  "intent": "market",
  "guardrail_passed": true,
  "steps": [
    { "node": "guardrail", "label": "Guardrail", "detail": "Finance query detected" },
    { "node": "router",    "label": "Router",    "detail": "Intent: market" },
    { "node": "market",    "label": "Market",    "detail": "Fetched TCS.NS" }
  ]
}
```

### `GET /market/trends?period=1M`

Returns live index data, top gainers/losers, and chart time-series.  
Supported periods: `1W`, `1M`, `3M`, `6M`

### `GET /portfolio/`

Returns holdings with live prices and P&L for the demo portfolio.

### `GET /news/?query=TCS`

Returns filtered finance news articles for a stock or general finance.

---

## Supported Stocks

The market agent supports 100+ tickers including:

- **Indian (NSE):** RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, WIPRO, LT, SBIN, and more
- **US:** AAPL, MSFT, GOOGL, AMZN, TSLA, META, NVDA, and more

---

## Running Tests

```bash
pytest
pytest -m "not integration"   # skip tests that require network or API keys
```

---

## Known Limitations

- The portfolio is hardcoded as a demo — persistent user portfolios are not yet supported.
- The FAISS vector store is not pre-loaded; RAG queries fall back to Tavily web search.
- `data.txt` is present but not yet ingested into the vector store.

---

## License

MIT
