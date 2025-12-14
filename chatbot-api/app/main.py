import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.prebuilt import ToolNode
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore
from dotenv import load_dotenv
from edges import (
    grade_documents,
    rewrite_question,
    generate_answer,
    summarize_documents,
)
from models.chat_model import model
from tools import load_file, add_documents, retrieve_documents
from schemas.states import State
from schemas.api import *

load_dotenv()

DB_URI = os.getenv("DATABASE_URL")
if not DB_URI:
    raise ValueError("DATABASE_URL environment variable not set")
APP_URL = os.getenv("APP_URL")
if not APP_URL:
    raise ValueError("APP_URL environment variable not set")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with (
        AsyncPostgresStore.from_conn_string(DB_URI) as store,
        AsyncPostgresSaver.from_conn_string(DB_URI) as checkpointer,
    ):
        await store.setup()
        await checkpointer.setup()

        workflow = StateGraph(state_schema=State).add_sequence(
            [
                grade_documents,
                rewrite_question,
                ToolNode([retrieve_documents]),
                generate_answer,
            ]
        )

        app.state.graph = workflow.compile(checkpointer=checkpointer)

        initialize_workflow = StateGraph(state_schema=State).add_sequence(
            [
                ToolNode([load_file]),
                summarize_documents,
                ToolNode([add_documents]),
                generate_answer,
            ]
        )
        app.state.initialize_graph = initialize_workflow.compile(
            checkpointer=checkpointer
        )

        app.state.checkpointer = checkpointer

        yield


# Initialize FastAPI app
app = FastAPI(lifespan=lifespan)

# Add CORS middleware (allow all origins for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[APP_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return "The chatbot is running"


@app.post("/api/innitialize_documents")
async def innitialize(request: InitializeRequest) -> ChatResponse:
    """Load the documents into the vector store, then summarize the documents.
    Put the summary in the state.context, then generate the reactflow mindmap data.
    """

    try:
        input_dict = State(
            messages=[HumanMessage(content=request.message, id=request.user_id)],
            file_path=request.file_path,
            context=[],
            data={},
        )
        config: RunnableConfig = {
            "configurable": {
                "thread_id": request.diagram_id,
            }
        }

        _ = await app.state.initialize_graph.update_state(config, input_dict)
        result = await app.state.initialize_graph.ainvoke(input_dict, config)
        return ChatResponse(
            messages=result["messages"],
            data=result["data"],
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500, detail="Failed to load and summarize documents"
        )
