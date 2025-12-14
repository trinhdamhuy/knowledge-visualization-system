from typing import Optional, List
from langchain_core.messages import BaseMessage
from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Request schema for the chatbot."""

    user_id: str
    diagram_id: str
    message: Optional[List[BaseMessage]] = None


class InitializeRequest(ChatRequest):
    """Request schema for the initialize endpoint."""

    file_path: str
