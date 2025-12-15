"""Tools for the chatbot workflow."""

import os
from dotenv import load_dotenv
from langchain.tools import tool
from langchain_community.document_loaders import PyMuPDFLoader
from app.schemas.tools import (
    LoadFileInput,
    AddDocumentsInput,
    RetrieveDocumentInput,
    LoadFileOutput,
    AddDocumentsOutput,
    RetrieveDocumentOutput,
)
from app.models.vector_store import store

load_dotenv()

AWS_BUCKET = os.getenv("AWS_BUCKET")
if not AWS_BUCKET:
    raise ValueError("AWS_BUCKET environment variable not set")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
if not AWS_ACCESS_KEY_ID:
    raise ValueError("AWS_ACCESS_KEY_ID environment variable not set")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
if not AWS_SECRET_ACCESS_KEY:
    raise ValueError("AWS_SECRET_ACCESS_KEY environment variable not set")


@tool(args_schema=LoadFileInput)
async def load_file(file_url: str) -> LoadFileOutput:
    """Load a file into the vector store."""

    loader = PyMuPDFLoader(file_url)
    documents = await loader.aload()
    return LoadFileOutput(documents=documents)


@tool(args_schema=AddDocumentsInput)
async def add_documents(params: AddDocumentsInput) -> AddDocumentsOutput:
    """Add documents to the vector store."""

    await store.aadd_documents(
        params.documents, metadata={"diagram_id": params.diagram_id}
    )
    return AddDocumentsOutput(success=True, message="Documents added successfully.")


@tool(args_schema=RetrieveDocumentInput)
async def retrieve_documents(params: RetrieveDocumentInput) -> RetrieveDocumentOutput:
    """Retrieve documents from the vector store."""

    retrieved_docs = await store.asimilarity_search(
        params.query, k=5, filter={"diagram_id": params.diagram_id}
    )
    return RetrieveDocumentOutput(documents=retrieved_docs)
