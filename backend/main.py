from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .Services.LLM import LLMService

# Initialize FastAPI app
app=FastAPI()
# Initialize LLM Service
llm_service = LLMService(model="gpt-4")  # You can specify the model you want to use

# Request body models
class PromptRequest(BaseModel):
    prompt: str

class SummarizeRequest(BaseModel):
    text: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message: Hey! I am FINNI AI"}

@app.post("/chat")
def chat():
    return {"message: This is the chat endpoint"}

@app.post("/ask")
def ask_gpt(request: PromptRequest):
    try:
        answer = llm_service.generate_response(request.prompt)
        return {"response": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summarize")
def summarize_text(request: SummarizeRequest):
    try:
        summary = llm_service.summarize(request.text)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
