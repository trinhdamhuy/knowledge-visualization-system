"""Embeddings configuration for the chatbot."""

from langchain_huggingface.embeddings import HuggingFaceEmbeddings

_embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-mpnet-base-v2"
)


def get_embeddings() -> HuggingFaceEmbeddings:
    """Get the embeddings model."""
    return _embeddings
