"""Main file for the chatbot API."""

import os
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig

from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore


from app.schemas.states import State
from app.schemas.api import ChatResponse, ChatRequest
from app.edges import (
    add_documents,
    grade_documents,
    load_file,
    rewrite_question,
    generate_answer,
    generate_mindmap_data,
    retrieve_documents,
    summarize_documents,
    route_grade_documents,
    route_mode,
)
from app.models.vector_store import create_vector_store, initialize_table

from dotenv import load_dotenv

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")
POSTGRES_DB = os.getenv("POSTGRES_DB")

if not all(
    [POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB]
):
    raise ValueError("One or more POSTGRES environment variables are not set")

CONNECTION_STRING = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}"
    f":{POSTGRES_PORT}/{POSTGRES_DB}"
)

APP_URL = os.getenv("APP_URL")
if not APP_URL:
    raise ValueError("APP_URL environment variable not set")


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    """Lifespan for the app."""
    async with (
        AsyncPostgresStore.from_conn_string(CONNECTION_STRING) as store,
        AsyncPostgresSaver.from_conn_string(CONNECTION_STRING) as checkpointer,
    ):
        await store.setup()
        await checkpointer.setup()

        await initialize_table()
        vector_store = await create_vector_store()
        fastapi_app.state.vector_store = vector_store
        fastapi_app.state.store = store

        workflow = StateGraph(state_schema=State)
        # Declare nodes
        workflow.add_node("load_file", load_file)
        workflow.add_node("add_documents", add_documents)
        workflow.add_node("summarize_documents", summarize_documents)
        workflow.add_node("grade_documents", grade_documents)
        workflow.add_node("rewrite_question", rewrite_question)
        workflow.add_node("retrieve_documents", retrieve_documents)
        workflow.add_node("generate_answer", generate_answer)
        workflow.add_node("generate_mindmap_data", generate_mindmap_data)

        # Route from START based on user-provided mode and file conditions
        workflow.add_conditional_edges(
            START,
            route_mode,
            {
                "load_file": "load_file",
                "generate_mindmap_data": "generate_mindmap_data",
                "grade_documents": "grade_documents",
            },
        )

        # Generate flow with file loading: load_file -> add_documents -> summarize_documents -> generate_mindmap_data
        workflow.add_edge("load_file", "add_documents")
        workflow.add_edge("add_documents", "summarize_documents")
        workflow.add_edge("summarize_documents", "generate_mindmap_data")

        # Generate flow: generate_mindmap_data -> END
        workflow.add_edge("generate_mindmap_data", END)

        # Chat flow: grade_documents -> (rewrite_question -> retrieve_documents)? -> generate_answer -> END
        workflow.add_conditional_edges(
            "grade_documents",
            route_grade_documents,
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


@app.get("/api/chat-history")
async def diagram_history(diagram_id: str) -> ChatResponse:
    """Get the history of the chatbot."""

    config: RunnableConfig = {
        "configurable": {
            "thread_id": diagram_id,
        }
    }
    graph_state = await app.state.graph.aget_state(config)
    state = graph_state.values
    return ChatResponse(
        messages=state.get("messages", []),
        data=state.get("data", {}),
    )


@app.post("/api/delete-chat-history")
async def delete_chat_history(diagram_id: str) -> Dict[str, str]:
    """Delete the chat history for a given diagram_id."""
    await app.state.checkpointer.adelete_thread(thread_id=diagram_id)
    return {"status": "success"}


@app.post("/api/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    """Chat with the chatbot."""
    try:
        config: RunnableConfig = {
            "configurable": {
                "thread_id": request.diagram_id,
                "vector_store": app.state.vector_store,
            }
        }
        graph_state = await app.state.graph.aget_state(config)
        state = graph_state.values

        # For generate mode with new file_url, we'll rebuild context from file
        # For chat mode, we keep existing context
        context = state.get("context", [])
        is_file_changed = request.file_url != state.get("file_url")

        input_dict = State(
            messages=[
                HumanMessage(
                    content=request.messages[-1].content,
                    id=request.user_id,
                    additional_kwargs={"data": request.data},
                ),
            ],
            diagram_id=request.diagram_id,
            file_url=request.file_url,
            context=context,
            mode=request.mode,
            is_file_changed=is_file_changed,
        )

        result = await app.state.graph.ainvoke(input_dict, config)

        _ = await app.state.graph.aupdate_state(config, result)

        return ChatResponse(
            messages=result["messages"],
            data=result["data"],
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500, detail="Failed to chat with the chatbot"
        ) from e
