from typing import Annotated, Sequence, Literal
from pydantic import BaseModel
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages


class BaseResponse(BaseModel):
    """Response schema for chat and delete endpoint."""

    status: Literal[200, 400, 500]
    message: str


class HistoryResponse(BaseModel):
    """Response schema for chat history endpoint."""

    status: Literal[200, 400, 500]
    messages: Annotated[Sequence[BaseMessage], add_messages] = None
    has_more: bool = False
    total: int = 0
