from pydantic import BaseModel, Field
from langchain_core.documents import Document


class LoadFileOutput(BaseModel):
    """Output schema for the load_file tool."""

    documents: list[Document]


class AddDocumentsOutput(BaseModel):
    """Output schema for the add_documents tool."""

    success: bool
    message: str


class RetrieveDocumentOutput(BaseModel):
    """Output schema for the retrieve_document tool."""

    documents: list[Document] = Field(
        default=[], description="The documents retrieved from the vector store"
    )
