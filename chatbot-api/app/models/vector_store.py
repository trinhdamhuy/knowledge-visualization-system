"""Vector store configuration for document embeddings and retrieval.

This module initializes a PostgreSQL-based vector store using Google Generative AI
embeddings for storing and retrieving document vectors.
"""

import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres import Column, PGEngine, PGVectorStore
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")
POSTGRES_DB = os.getenv("POSTGRES_DB")

if not all(
    [POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB]
):
    raise ValueError("One or more POSTGRES environment variables are not set")

CONNECTION_STRING = (
    f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}"
    f":{POSTGRES_PORT}/{POSTGRES_DB}"
)
engine = create_async_engine(CONNECTION_STRING)

pg_engine = PGEngine.from_engine(engine)

embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")

TABLE_NAME = "chatbot_docs"


async def initialize_table():
    """Initialize the vector store table once.

    If the table already exists, this function becomes a no-op.
    """
    # Check if table already exists to avoid re-creating it
    async with engine.begin() as conn:
        # `to_regclass` returns NULL if the relation does not exist
        result = await conn.execute(
            text("SELECT to_regclass(:table_name)"),
            {"table_name": TABLE_NAME},
        )
        table_exists = result.scalar() is not None

    if table_exists:
        return

    # Only create the table if it does not exist yet
    await pg_engine.ainit_vectorstore_table(
        table_name=TABLE_NAME,
        vector_size=3072,
        metadata_columns=[Column("diagram_id", "TEXT")],
    )


async def create_vector_store() -> PGVectorStore:
    """Create and return a PGVectorStore instance for the chatbot."""
    return await PGVectorStore.create(
        engine=pg_engine,
        table_name=TABLE_NAME,
        embedding_service=embeddings,
        metadata_columns=["diagram_id"],
    )
