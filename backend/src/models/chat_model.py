"""Chat model configuration for the chatbot."""

import os
import getpass
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI

load_dotenv()

if not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter your OpenAI API key: ")

_model = ChatOpenAI(
    model="gpt-5-nano",
    temperature=0.5,
)


def get_chat_model() -> ChatOpenAI:
    """Get the chat model."""
    return _model
