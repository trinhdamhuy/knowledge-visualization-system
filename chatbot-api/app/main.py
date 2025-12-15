"""Main file for the chatbot API."""

import os
from contextlib import asynccontextmanager
from typing import List
from IPython.display import Image

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore

from dotenv import load_dotenv

from app.schemas.states import State
from app.schemas.api import ChatResponse, InitializeRequest
from app.tools import load_file, add_documents, retrieve_documents
from app.edges import (
    grade_documents,
    rewrite_question,
    summarize_documents,
    generate_answer,
)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")
APP_URL = os.getenv("APP_URL")
if not APP_URL:
    raise ValueError("APP_URL environment variable not set")


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    """Lifespan for the app."""
    async with (
        AsyncPostgresStore.from_conn_string(DATABASE_URL) as store,
        AsyncPostgresSaver.from_conn_string(DATABASE_URL) as checkpointer,
    ):
        await store.setup()
        await checkpointer.setup()

        workflow = StateGraph(state_schema=State)
        workflow.add_node("grade_documents", grade_documents)
        workflow.add_node("rewrite_question", rewrite_question)
        workflow.add_node("retrieve_documents", ToolNode([retrieve_documents]))
        workflow.add_node("generate_answer", generate_answer)

        workflow.add_edge(START, "grade_documents")
        workflow.add_conditional_edges(
            "grade_documents",
            grade_documents,
            {
                "generate_answer": "generate_answer",
                "rewrite_question": "rewrite_question",
            },
        )
        workflow.add_edge("rewrite_question", "retrieve_documents")
        workflow.add_edge("retrieve_documents", "generate_answer")
        workflow.add_edge("generate_answer", END)
        fastapi_app.state.graph = workflow.compile(checkpointer=checkpointer)

        initialize_workflow = StateGraph(state_schema=State)
        initialize_workflow.add_node("load_file", ToolNode([load_file]))
        initialize_workflow.add_node("add_documents", ToolNode([add_documents]))
        initialize_workflow.add_node("generate_answer", generate_answer)

        initialize_workflow.add_edge(START, "load_file")
        initialize_workflow.add_edge("load_file", "add_documents")
        initialize_workflow.add_edge("add_documents", "generate_answer")
        initialize_workflow.add_edge("generate_answer", END)
        fastapi_app.state.initialize_graph = initialize_workflow.compile(
            checkpointer=checkpointer
        )

        fastapi_app.state.checkpointer = checkpointer

        yield


# Initialize FastAPI app
app = FastAPI(lifespan=lifespan, title="Chatbot API", description="API for the chatbot")

# Add CORS middleware (allow all origins for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[APP_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_root() -> str:
    """Read the root endpoint."""
    return "The chatbot is running"


@app.get("/api/history")
async def get_history(diagram_id: str) -> ChatResponse:
    """Get the history of the chatbot."""

    config: RunnableConfig = {
        "configurable": {
            "thread_id": diagram_id,
        }
    }
    state = await app.state.initialize_graph.aget_state(config).values
    return ChatResponse(messages=state.get("messages", []))


@app.post("/api/innitialize_documents")
async def innitialize(request: InitializeRequest) -> ChatResponse:
    """Load the documents into the vector store, then summarize the documents.
    Put the summary in the state.context, then generate the reactflow mindmap data.
    """

    try:
        input_dict = State(
            messages=[
                HumanMessage(content=request.message, id=request.user_id),
            ],
            file_url=request.file_url,
            context=[],
            data={},
        )
        config: RunnableConfig = {
            "configurable": {
                "thread_id": request.diagram_id,
            }
        }

        _ = await app.state.initialize_graph.aupdate_state(config, input_dict)
        result = await app.state.initialize_graph.ainvoke(input_dict, config)
        return ChatResponse(
            messages=result["messages"],
            data=result["data"],
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500, detail="Failed to load and summarize documents"
        ) from e
