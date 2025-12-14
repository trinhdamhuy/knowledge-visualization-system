from schemas.tools import *
from models.vector_store import store
from langchain.tools import tool, ToolRuntime
from langchain_community.document_loaders import S3FileLoader
import os
from dotenv import load_dotenv

load_dotenv()

BUCKET_NAME = os.getenv("AWS_BUCKET")
if not BUCKET_NAME:
    raise ValueError("AWS_BUCKET_NAME environment variable not set")
KEY = os.getenv("AWS_KEY")
if not KEY:
    raise ValueError("AWS_KEY environment variable not set")
SECRET = os.getenv("AWS_SECRET")
if not SECRET:
    raise ValueError("AWS_SECRET environment variable not set")

loader = S3FileLoader(
    bucket_name=BUCKET_NAME,
    aws_access_key_id=KEY,
    aws_secret_access_key=SECRET,
)


@tool(args_schema=LoadFileInput)
def load_file(input: LoadFileInput, runtime: ToolRuntime) -> LoadFileOutput:
    """Load a file into the vector store."""

    writer = runtime.stream_writer
    writer.write("Loading file...")
    documents = loader.load(input.file_path)
    writer.write("File loaded successfully.")
    return LoadFileOutput(documents=documents)


@tool(args_schema=AddDocumentsInput)
def add_documents(input: AddDocumentsInput, runtime: ToolRuntime) -> AddDocumentsOutput:
    """Add documents to the vector store."""

    writer = runtime.stream_writer
    writer.write("Adding documents...")
    store.add_documents(input.documents, metadata={"diagram_id": input.diagram_id})
    writer.write("Documents added successfully.")
    return AddDocumentsOutput(success=True, message="Documents added successfully.")


@tool(args_schema=RetrieveDocumentInput)
def retrieve_documents(
    input: RetrieveDocumentInput, runtime: ToolRuntime
) -> RetrieveDocumentOutput:
    """Retrieve documents from the vector store."""

    writer = runtime.stream_writer
    writer.write("Retrieving documents...")
    retrieved_docs = store.similarity_search(
        input.query, k=5, filter={"diagram_id": input.diagram_id}
    )
    writer.write("Documents retrieved successfully.")
    return RetrieveDocumentOutput(documents=retrieved_docs)
