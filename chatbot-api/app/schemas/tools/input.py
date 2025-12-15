from pydantic import BaseModel, Field
from langchain_core.documents import Document


class LoadFileInput(BaseModel):
    """Input schema for the load_file tool."""

    file_url: str


class AddDocumentsInput(BaseModel):
    """Input schema for the add_documents tool."""

    documents: list[Document] = Field(
        default=[], description="The documents to be added to the vector store"
    )
    diagram_id: str


class RetrieveDocumentInput(BaseModel):
    """Input schema for the retrieve_document tool."""

    diagram_id: str
    query: str
