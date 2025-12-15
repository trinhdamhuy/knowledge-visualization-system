"""Tools for the chatbot workflow."""

import os
from dotenv import load_dotenv
from langchain.tools import tool, ToolRuntime
from langchain_community.document_loaders import S3FileLoader
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

BUCKET_NAME = os.getenv("AWS_BUCKET")
if not BUCKET_NAME:
    raise ValueError("AWS_BUCKET_NAME environment variable not set")
ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
if not ACCESS_KEY_ID:
    raise ValueError("AWS_ACCESS_KEY_ID environment variable not set")
SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
if not SECRET_ACCESS_KEY:
    raise ValueError("AWS_SECRET_ACCESS_KEY environment variable not set")


@tool(args_schema=LoadFileInput)
def load_file(params: LoadFileInput, runtime: ToolRuntime) -> LoadFileOutput:
    """Load a file into the vector store."""

    writer = runtime.stream_writer
    writer.write("Loading file...")
    file_loader = S3FileLoader(
        bucket=BUCKET_NAME,
        key=params.file_path,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
    )
    documents = file_loader.load()
    writer.write("File loaded successfully.")
    return LoadFileOutput(documents=documents)


@tool(args_schema=AddDocumentsInput)
def add_documents(params: AddDocumentsInput, runtime: ToolRuntime) -> AddDocumentsOutput:
    """Add documents to the vector store."""

    writer = runtime.stream_writer
    writer.write("Adding documents...")
    store.add_documents(params.documents, metadata={"diagram_id": params.diagram_id})
    writer.write("Documents added successfully.")
    return AddDocumentsOutput(success=True, message="Documents added successfully.")


@tool(args_schema=RetrieveDocumentInput)
def retrieve_documents(
    params: RetrieveDocumentInput, runtime: ToolRuntime
) -> RetrieveDocumentOutput:
    """Retrieve documents from the vector store."""

    writer = runtime.stream_writer
    writer.write("Retrieving documents...")
    retrieved_docs = store.similarity_search(
        input.query, k=5, filter={"diagram_id": params.diagram_id}
    )
    writer.write("Documents retrieved successfully.")
    return RetrieveDocumentOutput(documents=retrieved_docs)
