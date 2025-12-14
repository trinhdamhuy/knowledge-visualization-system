from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages
from pydantic import BaseModel, Field
from typing import Annotated, Optional, Sequence


class ChatResponse(BaseModel):
    """Response schema for the initialize endpoint."""

    messages: Annotated[Sequence[BaseMessage], add_messages] = None
    data: Optional[dict] = Field(
        default=None, description="The data to be returned to the user"
    )
