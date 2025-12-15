from typing import Annotated, TypedDict, Optional, List
from langchain_core.messages import BaseMessage
from langchain_core.documents import Document
from langgraph.graph.message import add_messages
from pydantic import Field


class State(TypedDict):
    """State schema for the chatbot."""

    messages: Annotated[list[BaseMessage], add_messages]
    file_url: Optional[str] = None
    context: Optional[List[Document]] = Field(
        default=[], description="The context of the documents"
    )
    data: Optional[dict] = Field(
        default={},
        description="The reactflow mindmap data generated from documents in json format",
    )
