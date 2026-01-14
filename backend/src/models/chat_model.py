"""Chat model configuration for the chatbot."""

import os

from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

_chat_model = ChatGoogleGenerativeAI(
    api_key=GOOGLE_API_KEY,
    model="gemini-2.5-flash-lite",
    temperature=0.3,
)


def get_chat_model() -> ChatGoogleGenerativeAI:
    """Get the chat model."""
    return _chat_model
