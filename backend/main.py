import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.chat import router
from backend.routes.portfolio import router as portfolio_router
from backend.routes.news import router as news_router
from backend.routes.market import router as market_router

from pydantic import BaseModel
from backend.Services.LLM import LLMService
from backend.Services.RAG import ask_Rag
import yfinance as yf
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# Initialize FastAPI app
app=FastAPI()

# Replace with your actual API key
AlphaVantage_API_KEY=os.getenv("AlphaVantage_API_KEY")



app.include_router(router, prefix="/chat")
app.include_router(portfolio_router, prefix="/portfolio")
app.include_router(news_router, prefix="/news")
app.include_router(market_router, prefix="/market")

# Initialize LLM Service
llm_service = LLMService(model="gpt-4")  # You can specify the model you want to use

# Request body models
class PromptRequest(BaseModel):
    prompt: str

class SummarizeRequest(BaseModel):
    text: str

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# stock price with alpha endpoint
@app.get("/stock/{symbol}")
def get_stock(symbol: str):
    try:
        url=f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={AlphaVantage_API_KEY}"

        response = requests.get(url)
        data = response.json()

        time_series = data.get("Time Series (Daily)")

        if not time_series:
            return {"error": "No data found or API limit reached"}

        labels = []
        prices = []

        # Get last 7 days
        for date, value in list(time_series.items())[:7]:
            labels.append(date)
            prices.append(float(value["4. close"]))

        labels.reverse()
        prices.reverse()

        return {
            "labels": labels,
            "prices": prices
        }

    except Exception as e:
        return {"error": str(e)}

# RAG endpoint    
@app.post("/ask")
def ask_gpt(data: dict):
    try:
        query = data.get("message")
        logger.info(f"Ask endpoint called with query: {query}")
        logger.debug(f"Full request data: {data}")
        answer = ask_Rag(query)
        logger.info(f"RAG response received: {answer}")
        return {"response": answer}
    except Exception as e:
        logger.error(f"Error in ask endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Summarization endpoint
@app.post("/summarize")
def summarize_text(request: SummarizeRequest):
    try:
        logger.info(f"Summarize endpoint called with text length: {len(request.text)}")
        summary = llm_service.summarize(request.text)
        logger.info(f"Summary generated: {summary}")
        return {"summary": summary}
    except Exception as e:
        logger.error(f"Error in summarize endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
