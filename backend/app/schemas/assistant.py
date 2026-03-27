from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    context: dict | None = None

class ChatResponse(BaseModel):
    reply: str
