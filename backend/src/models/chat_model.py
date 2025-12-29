"""Chat model configuration for the chatbot."""

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set")


model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=1.0,
    api_key=GOOGLE_API_KEY,
)
