from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from chat import get_askjo_response

app = FastAPI(title="Ask Jo API", description="AI Chatbot for Cameroonian Youth")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    language: str = "auto"  # "english", "french", or "auto"

class ChatResponse(BaseModel):
    reply: str
    language_detected: str

# --- Routes ---
@app.get("/")
def root():
    return {"message": "Ask Jo API is running 🇨🇲"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        reply, lang = get_askjo_response(messages, request.language)
        return ChatResponse(reply=reply, language_detected=lang)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
