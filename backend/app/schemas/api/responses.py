from typing import Annotated, Sequence
from pydantic import BaseModel
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages


class ChatResponse(BaseModel):
    """Response schema for the initialize endpoint."""

    messages: Annotated[Sequence[BaseMessage], add_messages] = None
