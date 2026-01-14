"""Vector store configuration for document embeddings and retrieval.

This module initializes a PostgreSQL-based vector store using Google Generative AI
embeddings for storing and retrieving document vectors.
"""

import os
from langchain_postgres import Column, PGEngine, PGVectorStore
from src.models.embeddings import get_embeddings
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

TABLE_NAME = "chatbot_docs"

# Global vector store instance container (avoids need for global statement)
_vector_store_container: dict[str, PGVectorStore | None] = {"instance": None}


async def _ensure_column_exists(column_name: str, column_type: str = "TEXT") -> None:
    """Ensure a metadata column exists on the underlying PGVector table.

    LangChain's PGVectorStore table may already exist (initialize_table is a no-op in that case),
    but we still need to add new metadata columns for filtering (e.g., file_url).
    """
    schema_name = "public"  # Default schema name used by langchain_postgres
    async with engine.begin() as conn:
        exists_result = await conn.execute(
            text(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = :schema
                  AND table_name = :table
                  AND column_name = :column
                """
            ),
            {"schema": schema_name, "table": TABLE_NAME, "column": column_name},
        )
        if exists_result.first() is None:
            await conn.execute(
                text(
                    f'ALTER TABLE "{schema_name}"."{TABLE_NAME}" '
                    f'ADD COLUMN "{column_name}" {column_type}'
                )
            )


async def initialize_table():
    """Initialize the vector store table once.

    If the table already exists, ensure required metadata columns exist.
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
        # Ensure required metadata columns exist (migrations for existing DBs)
        await _ensure_column_exists("diagram_id", "TEXT")
        await _ensure_column_exists("file_url", "TEXT")
        return

    # Only create the table if it does not exist yet
    await pg_engine.ainit_vectorstore_table(
        table_name=TABLE_NAME,
        vector_size=1024,
        metadata_columns=[Column("diagram_id", "TEXT"), Column("file_url", "TEXT")],
    )


async def init_vector_store() -> PGVectorStore:
    """Initialize and return the global vector store instance."""
    if _vector_store_container["instance"] is None:
        _vector_store_container["instance"] = await PGVectorStore.create(
            engine=pg_engine,
            table_name=TABLE_NAME,
            embedding_service=get_embeddings(),
            metadata_columns=["diagram_id", "file_url"],
        )
    return _vector_store_container["instance"]


def get_vector_store() -> PGVectorStore:
    """Get the global vector store instance.

    Raises:
        ValueError: If the vector store has not been initialized.
    """
    instance = _vector_store_container["instance"]
    if instance is None:
        raise ValueError(
            "Vector store has not been initialized. Call init_vector_store() first."
        )
    return instance


async def count_by_filter(filter_dict: dict) -> int:
    """Count documents in the vector store matching the filter.

    Args:
        filter_dict: Dictionary of filter conditions (e.g., {"diagram_id": "some_id", "file_url": "..."})

    Returns:
        Number of rows matching the filter
    """
    schema_name = "public"  # Default schema name used by langchain_postgres

    if filter_dict:
        conditions = []
        param_dict = {}
        for idx, (key, value) in enumerate(filter_dict.items()):
            param_name = f"filter_{idx}"
            conditions.append(f'"{key}" = :{param_name}')
            param_dict[param_name] = value
        where_clause = f"WHERE {' AND '.join(conditions)}"
    else:
        where_clause = ""
        param_dict = {}

    query = f'SELECT COUNT(*) FROM "{schema_name}"."{TABLE_NAME}" {where_clause}'

    async with engine.begin() as conn:
        result = await conn.execute(text(query), param_dict)
        return int(result.scalar() or 0)


async def delete_by_filter(filter_dict: dict) -> int:
    """Delete documents from the vector store matching the filter.

    Args:
        filter_dict: Dictionary of filter conditions (e.g., {"diagram_id": "some_id"})

    Returns:
        Number of deleted rows
    """
    schema_name = "public"  # Default schema name used by langchain_postgres

    # Build filter clause - support simple equality filters
    if filter_dict:
        conditions = []
        param_dict = {}
        for idx, (key, value) in enumerate(filter_dict.items()):
            param_name = f"filter_{idx}"
            conditions.append(f'"{key}" = :{param_name}')
            param_dict[param_name] = value
        where_clause = f"WHERE {' AND '.join(conditions)}"
    else:
        where_clause = ""
        param_dict = {}

    query = f'DELETE FROM "{schema_name}"."{TABLE_NAME}" {where_clause}'

    async with engine.begin() as conn:
        result = await conn.execute(text(query), param_dict)
        return result.rowcount
