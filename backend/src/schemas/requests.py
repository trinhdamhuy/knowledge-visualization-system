from typing import Optional, List
from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request schema for the chatbot."""

    user_id: str
    diagram_id: str
    file_url: Optional[str] = Field(
        default=None,
        description="Source file URL, optional (will load if need_initialize_data is True)",
    )
    messages: Optional[List[BaseMessage]] = Field(description="List of chat messages")
    mindmap_data: Optional[dict] = Field(
        default={},
        description="Existing mindmap data (nodes and edges) to include in context",
    )
    need_initialize_data: Optional[bool] = Field(
        default=False,
        description="Whether to reload data from file (load_file -> add_documents)",
    )


class DeleteRequest(BaseModel):
    """Request schema for deleting chat history or diagram store."""

    diagram_id: str
    user_id: Optional[str] = None
