"""Main file for the chatbot API."""

import os
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import httpx

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig

from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore


from app.schemas import (
    State,
    ChatRequest,
    DeleteRequest,
    BaseResponse,
    HistoryResponse,
)
from app.edges import (
    add_documents,
    grade_documents,
    load_file,
    rewrite_question,
    generate_answer,
    generate_mindmap_data,
    retrieve_documents,
    summarize_documents,
    route_mode,
)
from app.models.vector_store import (
    init_vector_store,
    initialize_table,
    delete_by_filter,
)


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

FRONTEND_URL = os.getenv("FRONTEND_URL")
if not FRONTEND_URL:
    raise ValueError("FRONTEND_URL environment variable not set")

LIVEBLOCKS_SECRET_KEY = os.getenv("LIVEBLOCKS_SECRET_KEY")
if not LIVEBLOCKS_SECRET_KEY:
    raise ValueError("LIVEBLOCKS_SECRET_KEY environment variable not set")

LIVEBLOCKS_API_URL = "https://api.liveblocks.io/v2"


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
        await init_vector_store()
        fastapi_app.state.store = store

        workflow = StateGraph(state_schema=State)
        # Declare nodes
        workflow.add_node("load_file", load_file)
        workflow.add_node("add_documents", add_documents)
        workflow.add_node("retrieve_documents", retrieve_documents)
        workflow.add_node("summarize_documents", summarize_documents)
        workflow.add_node("grade_documents", grade_documents)
        workflow.add_node("rewrite_question", rewrite_question)
        workflow.add_node("generate_answer", generate_answer)
        workflow.add_node("generate_mindmap_data", generate_mindmap_data)

        # Route from START based on user-provided mode and file conditions
        workflow.add_conditional_edges(
            START,
            route_mode,
            {
                "load_file": "load_file",
                "generate_mindmap_data": "generate_mindmap_data",
                "retrieve_documents": "retrieve_documents",
            },
        )

        # Generate flow with file loading: load_file -> add_documents -> summarize_documents -> generate_mindmap_data
        workflow.add_edge("load_file", "add_documents")
        workflow.add_edge("add_documents", "summarize_documents")
        workflow.add_edge("summarize_documents", "generate_mindmap_data")

        # Generate flow: generate_mindmap_data -> END
        workflow.add_edge("generate_mindmap_data", END)

        # Chat flow: retrieve_documents -> grade_documents -> (rewrite_question -> retrieve_documents)? -> generate_answer -> END
        workflow.add_conditional_edges(
            "retrieve_documents",
            grade_documents,
            {
                "generate_answer": "generate_answer",
                "rewrite_question": "rewrite_question",
                "no_relevant_data": "generate_answer",
            },
        )
        workflow.add_edge("rewrite_question", "retrieve_documents")
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
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_root() -> str:
    """Read the root endpoint."""
    return "The chatbot is running"


@app.get("/api/chat-history", response_model=HistoryResponse)
async def diagram_history(diagram_id: str):
    """Get the history of the chatbot."""

    config: RunnableConfig = {
        "configurable": {
            "thread_id": diagram_id,
        }
    }
    graph_state = await app.state.graph.aget_state(config)
    state = graph_state.values
    return HistoryResponse(
        status=200,
        messages=state.get("messages", []),
    )


@app.delete("/api/delete-chat-history", response_model=BaseResponse)
async def delete_chat_history(request: DeleteRequest):
    """Delete the chat history for a given diagram_id."""
    await app.state.checkpointer.adelete_thread(thread_id=request.diagram_id)
    return BaseResponse(status=200, message="Chat history deleted successfully")


@app.delete("/api/delete-diagram-store", response_model=BaseResponse)
async def delete_diagram_store(request: DeleteRequest):
    """Delete the diagram store for a given diagram_id."""
    deleted_count = await delete_by_filter(
        filter_dict={"diagram_id": request.diagram_id}
    )
    return BaseResponse(
        status=200,
        message=f"Diagram store deleted successfully. {deleted_count} documents removed.",
    )


async def process_stream_chat(
    request: ChatRequest,
    app_state,
) -> None:
    """
    Process chat request and send broadcast events to Liveblocks.
    Frontend only receives data via broadcast events, not SSE.
    """
    config: RunnableConfig = {
        "configurable": {
            "thread_id": request.diagram_id,
        }
    }
    graph_state = await app_state.graph.aget_state(config)
    state = graph_state.values

    # For generate mode with new file_url, we'll rebuild context from file
    # For chat mode, we keep existing context
    context = state.get("context", [])

    input_dict = State(
        messages=[
            HumanMessage(
                content=request.messages[-1].content,
                additional_kwargs={
                    "user_id": request.user_id,
                    "mindmap_data": request.mindmap_data,
                },
            ),
        ],
        diagram_id=request.diagram_id,
        file_url=request.file_url,
        context=context,
        mode=request.mode,
        need_initialize_data=request.need_initialize_data,
    )

    room_id = request.diagram_id
    broadcast_url = f"{LIVEBLOCKS_API_URL}/rooms/{room_id}/broadcast_event"

    async with httpx.AsyncClient() as client:
        try:
            async for chunk in app.state.graph.astream(
                input_dict,
                config=config,
                stream_mode="custom",
            ):
                # Send broadcast event to Liveblocks for each chunk
                if isinstance(chunk, dict):
                    try:
                        # Prepare broadcast event payload
                        event_payload = {
                            "type": "stream_chunk",
                            "payload": chunk,
                        }

                        # Send broadcast event to Liveblocks
                        response = await client.post(
                            broadcast_url,
                            headers={
                                "Authorization": f"Bearer {LIVEBLOCKS_SECRET_KEY}",
                                "Content-Type": "application/json",
                            },
                            json=event_payload,
                            timeout=10.0,
                        )
                        response.raise_for_status()
                    except httpx.HTTPError as e:
                        # Log error but continue streaming
                        print(f"Failed to send broadcast event to Liveblocks: {e}")
                else:
                    # For non-dict chunks, send as broadcast event too
                    try:
                        event_payload = {
                            "type": "stream_chunk",
                            "payload": {"chunk": str(chunk)},
                        }
                        response = await client.post(
                            broadcast_url,
                            headers={
                                "Authorization": f"Bearer {LIVEBLOCKS_SECRET_KEY}",
                                "Content-Type": "application/json",
                            },
                            json=event_payload,
                            timeout=10.0,
                        )
                        response.raise_for_status()
                    except httpx.HTTPError as e:
                        print(f"Failed to send broadcast event to Liveblocks: {e}")
        finally:
            # Send stream_complete event to set chatbot status to idle
            try:
                complete_event = {
                    "type": "stream_complete",
                    "payload": {},
                }
                response = await client.post(
                    broadcast_url,
                    headers={
                        "Authorization": f"Bearer {LIVEBLOCKS_SECRET_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=complete_event,
                    timeout=10.0,
                )
                response.raise_for_status()
            except httpx.HTTPError as e:
                print(f"Failed to send stream_complete event to Liveblocks: {e}")


@app.post("/api/stream-chat", response_model=BaseResponse)
async def stream_chat(
    request: ChatRequest,
):
    """
    Process chat request and send broadcast events to Liveblocks.
    Frontend only receives data via broadcast events, not SSE.
    Returns a simple response indicating the request was accepted.
    """
    # Process stream in background (fire and forget)
    # This allows the endpoint to return immediately while streaming continues
    asyncio.create_task(process_stream_chat(request, app.state))

    return BaseResponse(
        status=200,
        message="Chat request accepted. Streaming via broadcast events.",
    )
