"""Embeddings configuration for the chatbot."""

import os
from langchain_ollama import OllamaEmbeddings

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")
if not OLLAMA_BASE_URL:
    raise ValueError("OLLAMA_BASE_URL environment variable not set")


def get_embeddings() -> OllamaEmbeddings:
    """Get the embeddings model."""
    return OllamaEmbeddings(
        base_url=OLLAMA_BASE_URL,
        model="mxbai-embed-large",
    )
