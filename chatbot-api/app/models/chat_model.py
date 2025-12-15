"""Chat model configuration for the chatbot."""

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from app.tools import load_file, add_documents, retrieve_documents

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

tools = [load_file, add_documents, retrieve_documents]
tools_by_name = {tool.name: tool for tool in tools}

model = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", api_key=GOOGLE_API_KEY)
model.bind_tools(tools)
