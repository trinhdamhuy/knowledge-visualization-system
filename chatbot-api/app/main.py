"""Main file for the chatbot API."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig

from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore


from app.schemas.states import State
from app.schemas.api import ChatResponse, InitializeRequest
from app.edges import (
    add_documents,
    grade_documents,
    load_file,
    rewrite_question,
    generate_answer,
    retrieve_documents,
)
from app.models.vector_store import create_vector_store, initialize_table

from dotenv import load_dotenv

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

        await initialize_table()
        vector_store = await create_vector_store()
        fastapi_app.state.vector_store = vector_store
        fastapi_app.state.store = store

        workflow = StateGraph(state_schema=State)
        workflow.add_node("grade_documents", grade_documents)
        workflow.add_node("rewrite_question", rewrite_question)
        workflow.add_node("retrieve_documents", retrieve_documents)
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
        fastapi_app.state.graph = workflow.compile(
            checkpointer=checkpointer, store=store
        )

        # Initialize workflow for loading documents and generating an initial answer
        initialize_workflow = StateGraph(state_schema=State).add_sequence(
            [load_file, add_documents, generate_answer]
        )
        initialize_workflow.add_edge(START, "load_file")

        fastapi_app.state.initialize_graph = initialize_workflow.compile(
            checkpointer=checkpointer, store=store
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
    graph_state = await app.state.initialize_graph.aget_state(config)
    state = graph_state.values
    return ChatResponse(
        messages=state.get("messages", []),
        data=state.get("data", {}),
    )


@app.post("/api/innitialize_documents")
async def innitialize(request: InitializeRequest) -> ChatResponse:
    """Load the documents into the vector store.
    Generate the reactflow mindmap data.
    """

    try:
        input_dict = State(
            messages=[
                HumanMessage(content=request.messages[-1].content, id=request.user_id),
            ],
            diagram_id=request.diagram_id,
            file_url=request.file_url,
            context=[],
            data={},
        )
        config: RunnableConfig = {
            "configurable": {
                "thread_id": request.diagram_id,
                "vector_store": app.state.vector_store,
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
