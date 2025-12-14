import os
import getpass
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")

store = PGVector(
    embeddings=embeddings,
    collection_name="chatbot_docs",
    connection=DATABASE_URL,
)

retriever = store.as_retriever(search_kwargs={"k": 5})
