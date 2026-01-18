"""Embeddings configuration for the chatbot."""

import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpointEmbeddings

load_dotenv()

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
if not HUGGINGFACE_API_KEY:
    raise ValueError("HUGGINGFACE_API_KEY environment variable not set")


def get_embeddings() -> HuggingFaceEndpointEmbeddings:
    """Get the embeddings model."""
    return HuggingFaceEndpointEmbeddings(
        huggingfacehub_api_token=HUGGINGFACE_API_KEY,
        model="mixedbread-ai/mxbai-embed-large-v1",
    )
