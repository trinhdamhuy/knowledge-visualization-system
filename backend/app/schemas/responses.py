from typing import Annotated, Sequence, Literal
from pydantic import BaseModel
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages


class ChatResponse(BaseModel):
    """Response schema for the initialize endpoint."""

    status: Literal[200, 400, 500]
    messages: Annotated[Sequence[BaseMessage], add_messages] = None


class DeleteResponse(BaseModel):
    """Response schema for the delete endpoint."""

    status: Literal[200, 400, 500]
    message: str
