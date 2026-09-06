from pydantic import BaseModel


class ChatRequest(BaseModel):
    user_message: str
    detected_disease: str | None = None
    session_id: str | None = None
    language: str = "English"
