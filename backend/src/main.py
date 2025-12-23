"""Main file for the chatbot API."""

import os
import json
from contextlib import asynccontextmanager
from typing import Optional, AsyncGenerator
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig

from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore


from src.schemas import (
    State,
    ChatRequest,
    DeleteRequest,
    BaseResponse,
    HistoryResponse,
)
from src.edges import (
    add_documents,
    grade_documents,
    load_file,
    rewrite_question,
    generate_answer,
    retrieve_documents,
    route_workflow,
)
from src.models.vector_store import (
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
        # Dictionary to store cancel flags for each diagram_id
        fastapi_app.state.cancel_flags = {}

        workflow = StateGraph(state_schema=State)
        # Declare nodes
        workflow.add_node("load_file", load_file)
        workflow.add_node("add_documents", add_documents)
        workflow.add_node("retrieve_documents", retrieve_documents)
        workflow.add_node("grade_documents", grade_documents)
        workflow.add_node("rewrite_question", rewrite_question)
        workflow.add_node("generate_answer", generate_answer)

        # Route from START based on need_initialize_data
        workflow.add_conditional_edges(
            START,
            route_workflow,
            {
                "load_file": "load_file",
                "retrieve_documents": "retrieve_documents",
            },
        )

        # Reload flow: load_file -> add_documents -> retrieve_documents
        workflow.add_edge("load_file", "add_documents")
        workflow.add_edge("add_documents", "retrieve_documents")

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
async def diagram_history(
    diagram_id: str, user_id: Optional[str] = None, limit: int = 10, offset: int = 0
):
    """Get the history of the chatbot with pagination."""

    # Use user-specific thread_id if user_id is provided
    thread_id = f"{diagram_id}_{user_id}" if user_id else diagram_id

    config: RunnableConfig = {
        "configurable": {
            "thread_id": thread_id,
        }
    }
    graph_state = await app.state.graph.aget_state(config)
    state = graph_state.values
    all_messages = state.get("messages", [])

    # Get total count
    total = len(all_messages)

    # Reverse messages to get newest first, then slice for pagination
    # We want to show newest messages first, so we reverse the list
    reversed_messages = list(reversed(all_messages))

    # Calculate pagination (offset from the end since we show newest first)
    # If offset is 0, we show the last 'limit' messages
    # If offset is 10, we show messages from position 10 to 10+limit
    start_index = offset
    end_index = offset + limit

    paginated_messages = reversed_messages[start_index:end_index]

    # Check if there are more messages
    has_more = end_index < len(reversed_messages)

    # Reverse back to chronological order (oldest first) for display
    paginated_messages = list(reversed(paginated_messages))

    return HistoryResponse(
        status=200,
        messages=paginated_messages,
        has_more=has_more,
        total=total,
    )


@app.delete("/api/delete-chat-history", response_model=BaseResponse)
async def delete_chat_history(request: DeleteRequest):
    """Delete the chat history for a given diagram_id and user_id."""
    # user_id is required for deleting chat history (each user has their own history)
    if not request.user_id:
        return BaseResponse(
            status=400, message="user_id is required to delete chat history"
        )

    # Use user-specific thread_id
    thread_id = f"{request.diagram_id}_{request.user_id}"
    await app.state.checkpointer.adelete_thread(thread_id=thread_id)
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


@app.post("/api/chat", response_model=BaseResponse)
async def chat(
    request: ChatRequest,
):
    """
    Legacy endpoint kept for compatibility; it now runs the flow without broadcasting.
    """
    # Fallback: run the graph once (non-streaming) and ignore chunks
    diagram_id = request.diagram_id
    user_id = request.user_id
    app.state.cancel_flags[diagram_id] = False

    thread_id = f"{diagram_id}_{user_id}" if user_id else diagram_id
    config: RunnableConfig = {
        "configurable": {
            "thread_id": thread_id,
        }
    }
    graph_state = await app.state.graph.aget_state(config)
    state = graph_state.values

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
        diagram_id=diagram_id,
        file_url=request.file_url,
        context=state.get("context", []),
        need_initialize_data=request.need_initialize_data,
    )

    async for _ in app.state.graph.astream(
        input_dict,
        config=config,
        stream_mode="custom",
    ):
        if app.state.cancel_flags.get(diagram_id, False):
            break

    app.state.cancel_flags[diagram_id] = False
    return BaseResponse(status=200, message="Chat request processed (no broadcast)")


async def stream_chat_events(
    request: ChatRequest,
    app_state,
) -> AsyncGenerator[str, None]:
    """
    Stream chat chunks directly to the client (per-request stream, no Liveblocks).
    Yields Server-Sent Events with JSON payloads.
    """
    diagram_id = request.diagram_id
    user_id = request.user_id

    app_state.cancel_flags[diagram_id] = False

    thread_id = f"{diagram_id}_{user_id}" if user_id else diagram_id
    config: RunnableConfig = {
        "configurable": {
            "thread_id": thread_id,
        }
    }
    graph_state = await app_state.graph.aget_state(config)
    state = graph_state.values

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
        diagram_id=diagram_id,
        file_url=request.file_url,
        context=context,
        need_initialize_data=request.need_initialize_data,
    )

    async def event_stream():
        try:
            async for chunk in app_state.graph.astream(
                input_dict,
                config=config,
                stream_mode="custom",
            ):
                if app_state.cancel_flags.get(diagram_id, False):
                    print(f"Chat cancelled for diagram_id: {diagram_id}")
                    break

                payload = chunk if isinstance(chunk, dict) else {"chunk": str(chunk)}
                data = json.dumps(payload, ensure_ascii=False)
                yield f"data: {data}\n\n"
        finally:
            app_state.cancel_flags[diagram_id] = False
            yield "event: stream_complete\ndata: {}\n\n"

    return event_stream()


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream chat response per-request (no Liveblocks broadcast).
    """
    event_generator = await stream_chat_events(request, app.state)
    return StreamingResponse(event_generator, media_type="text/event-stream")


@app.post("/api/chat/cancel", response_model=BaseResponse)
async def cancel_chat(request: DeleteRequest):
    """
    Cancel an ongoing chat request for a given diagram_id.
    """
    diagram_id = request.diagram_id
    app.state.cancel_flags[diagram_id] = True
    return BaseResponse(status=200, message="Chat cancellation requested")
