from typing import Optional, List, Literal
from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request schema for the chatbot (supports both generate and chat)."""

    user_id: str
    diagram_id: str
    mode: Literal["generate", "chat"] = Field(
        description=(
            "Flow mode: 'generate' to generate/regenerate mindmap (may load file if needed), "
            "'chat' for normal chat"
        ),
    )
    file_url: Optional[str] = Field(
        default=None,
        description="Source file URL, optional for generate mode (will load if different from stored or if no file was loaded before)",
    )
    messages: Optional[List[BaseMessage]] = Field(description="List of chat messages")
    is_file_changed: Optional[bool] = Field(
        default=False,
        description="Whether the file has changed since the last request",
    )


class InitializeRequest(ChatRequest):
    """Request schema for the initialize endpoint (backward compatible wrapper)."""

    file_url: str
