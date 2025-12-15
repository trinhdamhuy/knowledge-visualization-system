from typing import Optional, List
from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request schema for the chatbot."""

    user_id: str
    diagram_id: str
    messages: Optional[List[BaseMessage]] = Field(description="List of chat messages")


class InitializeRequest(ChatRequest):
    """Request schema for the initialize endpoint."""

    file_url: str
