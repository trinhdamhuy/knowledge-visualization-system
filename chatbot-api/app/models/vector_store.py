"""Vector store configuration for document embeddings and retrieval.

This module initializes a PostgreSQL-based vector store using Google Generative AI
embeddings for storing and retrieving document vectors.
"""

import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres import PGEngine, PGVectorStore
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

engine = create_async_engine(
    "postgresql+asyncpg://postgres:1@localhost:6024/knowledge-visualization-vector"
)

pg_engine = PGEngine.from_engine(engine)

embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")

TABLE_NAME = "chatbot_docs"

store = PGVectorStore.create(
    engine=pg_engine,
    table_name=TABLE_NAME,
    embedding_service=embeddings,
    metadata_columns=["diagram_id"],
)
