"""Edges for the chatbot workflow."""

import os
import tempfile
from typing import Literal, Dict
from pydantic import BaseModel, Field

from langchain_core.messages import AIMessage
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langgraph.config import get_stream_writer

from src.models.text_splitter import get_text_splitter
from src.schemas.states import State
from src.models.vector_store import get_vector_store, delete_by_filter, count_by_filter
from src.models.s3_client import get_s3_client
from src.models.chat_model import get_chat_model

model = get_chat_model()


def _filter_non_empty_documents(documents: list[Document]) -> list[Document]:
    """Remove documents with empty/whitespace-only content.

    Gemini embeddings rejects empty text with 400 INVALID_ARGUMENT.
    """
    non_empty: list[Document] = []
    for doc in documents or []:
        content = getattr(doc, "page_content", None)
        if isinstance(content, str) and content.strip():
            non_empty.append(doc)
    return non_empty


async def load_file(state: State):
    """Load a file into documents.

    Downloads file from Supabase storage, processes it locally, then deletes the temporary file.
    """
    writer = get_stream_writer()

    file_url = state["file_url"]

    if not file_url:
        writer({"current_status": "File URL not provided"})
        return {"context": []}

    # Determine file type
    if not (file_url.endswith(".txt") or file_url.endswith(".pdf")):
        writer({"current_status": "Can not load file"})
        return {"context": []}

    # Get the key (file_url is the key like "folder/name.ext")
    key = file_url

    # Create temporary file
    temp_file = None
    try:
        # Get file extension to create temp file with correct extension
        file_ext = os.path.splitext(key)[1] or ".tmp"

        # Create temporary file
        temp_fd, temp_file = tempfile.mkstemp(suffix=file_ext)
        os.close(temp_fd)  # Close file descriptor, we'll use the path

        writer({"current_status": "Downloading file from storage..."})

        # Download file from Supabase storage
        supabase = get_s3_client()
        response = supabase.storage.from_("knovion").download(key)

        if response is None:
            writer({"current_status": "Failed to download file from storage"})
            return {"context": []}

        # Write downloaded content to temporary file
        with open(temp_file, "wb+") as f:
            f.write(response)

        writer({"current_status": "Processing file..."})

        # Load file from local path
        if file_url.endswith(".txt"):
            loader = TextLoader(temp_file)
        elif file_url.endswith(".pdf"):
            loader = PyPDFLoader(temp_file)
        else:
            writer({"current_status": "Can not load file"})
            return {"context": []}

        documents = await loader.aload()
        documents = _filter_non_empty_documents(documents)

        if not documents:
            writer(
                {
                    "current_status": "File loaded but contains no text content to process."
                }
            )
            return {"context": []}

        writer({"current_status": "Splitting documents into chunks..."})
        text_splitter = get_text_splitter()
        split_documents = []
        for doc in documents:
            chunks = text_splitter.split_documents([doc])
            split_documents.extend(chunks)

        return {"context": split_documents}

    except Exception as e:  # pylint: disable=broad-exception-caught
        writer({"current_status": f"Can not load file: {str(e)}"})
        return {"context": []}
    finally:
        # Clean up: delete temporary file
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception:  # pylint: disable=broad-exception-caught
                # Best effort cleanup - log but don't fail
                pass


async def add_documents(state: State):
    """Add documents to the vector store."""

    writer = get_stream_writer()
    writer({"current_status": "Adding documents..."})

    vector_store = get_vector_store()

    diagram_id = state["diagram_id"]
    file_url = state.get("file_url")
    need_initialize_data = state.get("need_initialize_data", False)
    context = _filter_non_empty_documents(state.get("context", []))

    if not diagram_id:
        writer({"current_status": "Diagram ID not found"})
        raise ValueError("Diagram ID not found")

    if not context:
        writer({"current_status": "No text content found to embed (empty documents)."})
        return {"context": []}

    # Option B:
    # - If reloading and the same file_url already exists in store -> skip embedding.
    # - If reloading and file_url is new -> delete existing docs for diagram_id, then add new docs.
    if need_initialize_data and file_url:
        try:
            existing_count = await count_by_filter(
                {"diagram_id": diagram_id, "file_url": file_url}
            )
            if existing_count > 0:
                writer(
                    {
                        "current_status": "Data for this file already exists. Skipping embedding..."
                    }
                )
                return {"context": context}

            writer({"current_status": "New file detected. Clearing old store data..."})
            await delete_by_filter(filter_dict={"diagram_id": diagram_id})
        except Exception as exc:  # pylint: disable=broad-exception-caught
            # Best-effort: proceed to add documents even if the check/cleanup fails.
            writer(
                {
                    "current_status": f"Warning: store check/cleanup failed, continuing: {exc}"
                }
            )

    # Add metadata directly to each document instead of passing separately
    for doc in context:
        if doc.metadata is None:
            doc.metadata = {}
        doc.metadata["diagram_id"] = diagram_id
        if file_url:
            doc.metadata["file_url"] = file_url

    await vector_store.aadd_documents(context)

    return {"context": context}


def get_question_for_retrieval(state: State) -> str:
    """Get the question to use for retrieval (uses the user's question directly)."""
    # Always use the content of the last message as the query question
    return state["messages"][-1].content


async def retrieve_documents(state: State):
    """Retrieve documents from the vector store."""

    writer = get_stream_writer()

    # If need_initialize_data is True, we just loaded the full file
    # Return all documents from context instead of similarity search
    need_initialize_data = state.get("need_initialize_data", False)
    existing_context = state.get("context", [])

    if need_initialize_data and existing_context:
        # When reloading from file, use all loaded documents for mindmap generation
        writer(
            {"current_status": "Using full document content for mindmap generation..."}
        )
        return {"context": existing_context}

    # Normal chat flow: use similarity search
    writer({"current_status": "Searching for relevant documents..."})

    question = get_question_for_retrieval(state)
    diagram_id = state["diagram_id"]
    file_url = state.get("file_url")
    vector_store = get_vector_store()

    # Prefer filtering by both diagram_id + file_url to avoid mixing old/new file data.
    # Backward-compatible fallback: if older rows don't have file_url yet, fall back to diagram_id only.
    filter_dict: dict = {"diagram_id": diagram_id}
    if file_url:
        filter_dict["file_url"] = file_url

    retrieved_docs = await vector_store.asimilarity_search(
        question, k=5, filter=filter_dict
    )
    if file_url and len(retrieved_docs) == 0:
        retrieved_docs = await vector_store.asimilarity_search(
            question, k=5, filter={"diagram_id": diagram_id}
        )
    if len(retrieved_docs) == 0:
        # No relevant documents found, return empty context for generate_answer to handle with NO_RELEVANT_DATA_PROMPT
        return {"context": []}
    return {"context": retrieved_docs}


ANSWER_PROMPT = (
    "You are an AI assistant helping the user understand their documents.\n"
    "User language can be different from the document's language, so you MUST ALWAYS use the user's language to answer the question except if the user asked to answer in a different language.\n"
    "Provide a helpful, conversational answer to the user's request.\n"
    "Explain the content clearly like a helpful assistant.\n"
    "\n"
    "FORMATTING REQUIREMENTS:\n"
    "- Use Markdown formatting to make your answer clear and well-structured\n"
    "- Use headings (##, ###) to organize different sections\n"
    "- Use bullet points (-) or numbered lists (1.) for multiple items\n"
    "- Use **bold** for important terms or concepts\n"
    "- Use `code blocks` for technical terms, code snippets, or specific values\n"
    "- Use > blockquotes for important notes or highlights\n"
    "- Break long paragraphs into shorter, readable chunks\n"
    "- Use proper spacing between sections for readability\n"
    "\n"
    "REFERENCE LINKS WITH HOVERCARD:\n"
    "When referring to specific pages in the PDF or nodes in the mindmap, use reference links with hash-based format:\n"
    "- For both page and node: [**text content**](#node/node-1766205361492#pdf/26) - combine with multiple hash fragments\n"
    "- For PDF page references: [**text content**](#pdf/26) where 26 is an ACTUAL page number from metadata (integer)\n"
    "- For node references: [**text content**](#node/node-1766205361492) where node-1766205361492 is an ACTUAL node ID\n"
    "\n"
    "CRITICAL FORMATTING RULES:\n"
    "- The text inside the square brackets MUST be wrapped in **bold** markdown: [**text content**](#pdf/26#node/node-1766205361492) or [**text content**](#pdf/26)\n"
    "- The text content should be natural, readable keywords or short phrases that flow naturally in the sentence\n"
    "- Use hash-based format: #pdf/<pageNumber> for PDF pages, #node/<nodeId> for nodes\n"
    "- When combining both, use multiple hash fragments: #node/<nodeId>#pdf/<pageNumber>\n"
    "- Example format: 'The [**Introduction**](#pdf/26#node/node-1766205361492) concept is important.'\n"
    "- Example with both: 'The [**Key findings**](#node/node-1766205361492#pdf/26) are explained in detail.'\n"
    "- NOT: 'The **Text** ([page 26](#pdf/26#node/node-1766205361492))' - this is WRONG\n"
    "- CORRECT: 'The [**Text**](#pdf/26#node/node-1766205361492) concept is important.'\n"
    "\n"
    "USAGE GUIDELINES:\n"
    "- ALWAYS use reference links when you have page numbers from document metadata - this is MANDATORY, not optional\n"
    "- When node IDs are provided (from existing or newly generated mindmap), you MUST include node references in your response\n"
    "- Embed references naturally within your sentences using format: [**text content**](#node/<nodeId>#pdf/<pageNumber>) or [**text content**](#pdf/<pageNumber>)\n"
    "- The text should be keywords or short phrases, like: 'According to the [**Introduction**](#node/node-1766205361492#pdf/26) node, this concept is important'\n"
    "- Or: 'See [**this section**](#node/node-1766205361492#pdf/26) for more details'\n"
    "- When page numbers are available in document metadata, you MUST include at least one page reference in your response\n"
    "- If node IDs are provided to you, you MUST include node references in your response - this is MANDATORY when node IDs are available\n"
    "- When both page numbers and node IDs are available, combine them: [**text content**](#node/<nodeId>#pdf/<pageNumber>)\n"
    "- The text inside brackets should be bold: [**text content**] not just [text content]\n"
    "\n"
    "CRITICAL: If node IDs are provided to you in the prompt, you MUST include node references in your response. Do not skip node references when node IDs are available.\n"
    "\n"
    "Examples:\n"
    "- 'The concept is represented by the [**Introduction**](#pdf/26#node/node-1766205361492) node in the mindmap.'\n"
    "- 'For comprehensive information, see [**this section**](#pdf/26#node/node-1766205361492) which covers this topic.'\n"
    "- 'According to [**the document**](#pdf/26), the main principles are...'\n"
    "- 'The [**Text**](#node/node-1766205361492#pdf/26) pattern combines both references.'\n"
    "- 'The [**Text**](#node/node-1766205361492#pdf/26) pattern is explained in detail.'\n"
    "\n"
    "User request:\n"
    "{request}\n"
    "\n"
    "Documents context:\n"
    "{context}\n"
)

NO_RELEVANT_DATA_PROMPT = (
    "The user's question is not related to the available documents, or no relevant documents were found.\n"
    "You MUST respond that you don't know the answer based on the available documents.\n"
    "CRITICAL: You MUST respond in the SAME LANGUAGE as the user's question..\n"
    "Keep your response brief and simple. Examples:\n"
    "- 'I don't know the answer based on the available documents.'\n"
    "\n"
    "User question:\n"
    "{request}\n"
)


class GenerateAnswer(BaseModel):
    """Generate an answer to the user's question."""

    answer: str = Field(default="", description="The answer to the question")


class NodeData(BaseModel):
    """Node data structure for React Flow."""

    label: str = Field(
        ...,
        description="The label text displayed in the node. Use concise keywords (1-3 words) following mindmap principles.",
    )
    color: str = Field(
        default="",
        description="Background color of the node (hex color code, e.g., '#E3F2FD'). Leave empty for default card color.",
    )
    fontFamily: str = Field(
        default="",
        description="Font family for the node text. MUST be one of: 'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'. Leave empty for default font (Inter).",
    )
    fontSize: float = Field(
        default=0,
        description="Font size for the node text in pixels (e.g., 14, 16, 18). Use 0 for default size.",
    )
    fontWeight: str = Field(
        default="",
        description="Font weight for the node text (e.g., 'normal', 'bold', '600', '700'). Leave empty for default weight.",
    )
    fontStyle: str = Field(
        default="",
        description="Font style for the node text (e.g., 'normal', 'italic'). Leave empty for default style.",
    )
    textDecoration: str = Field(
        default="",
        description="Text decoration for the node text (e.g., 'none', 'underline'). Leave empty for default decoration.",
    )
    textColor: str = Field(
        default="",
        description="Text color for the node (hex color code, e.g., '#000000' for black, '#ffffff' for white). CRITICAL: MUST be set when color (background) is provided. If background color is light (e.g., '#E3F2FD', '#F3E5F5', '#E8F5E9'), use dark text (#000000 or dark colors like '#1a1a1a'). If background color is dark (e.g., '#1a1a1a', '#2d2d2d'), use light text (#ffffff or light colors). Leave empty for default (theme-based).",
    )
    pageReference: int = Field(
        default=0,
        description="Page number in PDF document that this node references (e.g., 26, 96). Use 0 if no page reference. This allows users to navigate to the specific page when clicking on the node.",
    )


class Measured(BaseModel):
    """Measured dimensions of the node."""

    width: float = Field(
        default=150, description="Measured width of the node in pixels"
    )
    height: float = Field(
        default=50, description="Measured height of the node in pixels"
    )


class Node(BaseModel):
    """React Flow node structure."""

    id: str = Field(..., description="Unique identifier for the node")
    position: Dict[str, float] = Field(
        ...,
        description="Node position with x and y coordinates. Center node should be at (0, 0) or near center. Branch nodes should radiate outward.",
    )
    width: float = Field(default=150, description="Width of the node in pixels")
    height: float = Field(default=50, description="Height of the node in pixels")
    data: NodeData = Field(..., description="Node data containing the label and color")
    type: str = Field(
        default="custom",
        description="Node type for React Flow. Always use 'custom' for all nodes.",
    )
    measured: Measured = Field(
        default_factory=lambda: Measured(width=150, height=50),
        description="Measured dimensions of the node",
    )


class EdgeData(BaseModel):
    """Edge data structure for React Flow."""

    label: str = Field(
        default="",
        description="Optional label text displayed on the edge. Leave empty if no label is needed.",
    )
    labelFontFamily: str = Field(
        default="",
        description="Font family for the edge label text. MUST be one of: 'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'. Leave empty for default font (Inter).",
    )
    labelFontSize: float = Field(
        default=0,
        description="Font size for the edge label text in pixels (e.g., 12, 14, 16). Use 0 for default size.",
    )


class Edge(BaseModel):
    """React Flow edge structure."""

    id: str = Field(
        ...,
        description="Unique identifier for the edge (format: 'xy-edge__SOURCE-TARGET' where SOURCE and TARGET are node IDs, or custom)",
    )
    source: str = Field(..., description="ID of the source node (parent)")
    target: str = Field(..., description="ID of the target node (child)")
    type: str = Field(
        default="default",
        description="Edge type for React Flow. Available types: 'default' (straight line), 'straight' (direct line), 'step' (right-angle), 'smoothstep' (curved hierarchical), 'simplebezier' (bezier curve). Use different types to create visual variety and hierarchy.",
    )
    style: Dict[str, str] = Field(
        default_factory=dict,
        description="Optional CSS styles for the edge (e.g., stroke, strokeWidth). Use colors to match parent node branches.",
    )
    animated: bool = Field(
        default=False,
        description="Whether the edge should be animated (true) or static (false). Use animation for emphasis or visual interest.",
    )
    data: EdgeData = Field(
        default_factory=EdgeData,
        description="Edge data containing optional label, labelFontFamily, and labelFontSize.",
    )


class MindmapData(BaseModel):
    """React Flow mindmap data structure."""

    nodes: Dict[str, Node] = Field(
        ..., description="Dictionary of nodes keyed by node ID"
    )
    edges: Dict[str, Edge] = Field(
        ..., description="Dictionary of edges keyed by edge ID"
    )


async def generate_answer(state: State):
    """Generate an answer and optionally mindmap data based on user request."""

    # Get the latest HumanMessage (user's most recent question)
    # Find the last HumanMessage in the messages list
    request = None
    for msg in reversed(state["messages"]):
        if msg.__class__.__name__ == "HumanMessage":
            request = msg.content
            break

    # Fallback to last message if no HumanMessage found
    if request is None:
        request = state["messages"][-1].content if state["messages"] else ""

    context_docs = state["context"]
    existing_mindmap_data = (
        state["messages"][-1].additional_kwargs.get("mindmap_data", {})
        if state["messages"] and state["messages"][-1].additional_kwargs
        else {}
    )

    writer = get_stream_writer()
    writer({"current_status": "Generating answer..."})

    # Logic:
    # - If no context documents, use NO_RELEVANT_DATA_PROMPT
    # - If context documents exist, generate answer with context
    if not context_docs or len(context_docs) == 0:
        # No documents found - use no relevant data prompt
        prompt = NO_RELEVANT_DATA_PROMPT.format(request=request)
        response = await model.with_structured_output(GenerateAnswer).ainvoke(
            [{"role": "user", "content": prompt}]
        )
        return {"messages": [AIMessage(content=response.answer)]}

    # We have context documents - generate answer with context
    # Include metadata (page numbers) in context so AI can use reference links
    context_parts = []
    for doc in context_docs:
        content = doc.page_content
        # Add page number if available in metadata
        if doc.metadata and "page" in doc.metadata:
            page_num = doc.metadata["page"]
            context_parts.append(f"[Page {page_num}]\n{content}")
        else:
            context_parts.append(content)
    context = "\n\n".join(context_parts)
    prompt = ANSWER_PROMPT.format(request=request, context=context)

    # Generate answer
    response = await model.with_structured_output(GenerateAnswer).ainvoke(
        [{"role": "user", "content": prompt}]
    )

    mindmap_dict = None

    try:
        # Prepare context for mindmap generation
        # Use the 'context' variable which already includes [Page X] markers
        full_context = context

        # If context is very long, create a high-level summary for mindmap generation
        if len(full_context) > 50000:
            summary_prompt = (
                "You are summarizing a large document to create a mindmap.\n"
                "Extract ONLY the high-level structure:\n"
                "- Main topic/subject\n"
                "- Major sections/chapters (3-5 main sections)\n"
                "- Key topics within each section (2-4 topics per section)\n"
                "Focus on organizational structure, not details.\n"
                "Output format: A structured summary with main topic, sections, and key topics.\n"
                "\n"
                "Document content:\n"
                f"{full_context[:100000]}\n"  # Limit to first 100k chars for summary
            )
            summary_response = await model.ainvoke(
                [{"role": "user", "content": summary_prompt}]
            )
            mindmap_context = summary_response.content
        else:
            mindmap_context = full_context

        # Extract node IDs from existing mindmap if available
        # Include ALL node IDs, not just first 10
        existing_node_ids = []
        existing_node_labels_map = {}
        if existing_mindmap_data and isinstance(existing_mindmap_data, dict):
            nodes = existing_mindmap_data.get("nodes", {})
            if isinstance(nodes, dict):
                existing_node_ids = list(nodes.keys())
                # Build a map of node IDs to labels for better context
                for node_id, node_data in nodes.items():
                    if isinstance(node_data, dict) and "data" in node_data:
                        label = node_data.get("data", {}).get("label", "")
                        if label:
                            existing_node_labels_map[node_id] = label

        # Update prompt to include node IDs for reference
        answer_prompt_with_nodes = prompt
        if existing_node_ids:
            # Create a more helpful list showing node IDs with their labels
            node_info_list = []
            for node_id in existing_node_ids:
                label = existing_node_labels_map.get(node_id, "")
                if label:
                    node_info_list.append(f"{node_id} (label: '{label}')")
                else:
                    node_info_list.append(node_id)

            node_ids_str = "\n".join(node_info_list)
            answer_prompt_with_nodes = (
                f"{prompt}\n\n"
                f"Available nodes from existing mindmap (you can reference these using hash format [**text content**](#node/node-id)):\n"
                f"Use the EXACT node IDs shown below - do not modify or abbreviate them.\n"
                f"\n"
                f"{node_ids_str}\n"
                f"\n"
                f"CRITICAL: When referencing nodes, use the EXACT node ID as shown above.\n"
                f"Format example: [**Introduction**](#node/node-1766205361492)\n"
            )
            # Re-generate answer with node context
            response = await model.with_structured_output(GenerateAnswer).ainvoke(
                [{"role": "user", "content": answer_prompt_with_nodes}]
            )

        # Generate mindmap data
        # Add instruction to create more nodes when reloading from full PDF
        need_initialize_data = state.get("need_initialize_data", False)
        mindmap_prompt_base = MINDMAP_PROMPT.format(
            request=request,
            context=mindmap_context,
            data=existing_mindmap_data,
        )

        # When reloading from PDF, encourage creating comprehensive mindmap
        if need_initialize_data and len(context_docs) > 10:
            mindmap_prompt = (
                f"{mindmap_prompt_base}\n\n"
                "IMPORTANT: You are creating a mindmap from the FULL document content (not just a few chunks). "
                "Create a COMPREHENSIVE mindmap that covers the entire document structure. "
                "Do NOT force a fixed number of nodes. Use as many nodes as needed to represent the full structure clearly. "
                "Include all major sections, chapters, and key topics. "
                "This is a full document mindmap, so be thorough but still organized."
            )
        else:
            mindmap_prompt = mindmap_prompt_base

        mindmap_response = await model.with_structured_output(MindmapData).ainvoke(
            [{"role": "user", "content": mindmap_prompt}]
        )
        mindmap_dict = mindmap_response.model_dump()

        # Normalize edges: if type is missing, default to simplebezier
        if mindmap_dict and isinstance(mindmap_dict, dict):
            edges = mindmap_dict.get("edges", {})
            if isinstance(edges, dict):
                for edge_data in edges.values():
                    if isinstance(edge_data, dict) and not edge_data.get("type"):
                        edge_data["type"] = "simplebezier"

        # Extract node IDs from newly generated mindmap for reference
        # Include ALL node IDs, not just first 10, so AI can reference any node
        new_node_ids = []
        node_labels_map = {}  # Map node IDs to their labels for better context
        if mindmap_dict and isinstance(mindmap_dict, dict):
            nodes = mindmap_dict.get("nodes", {})
            if isinstance(nodes, dict):
                new_node_ids = list(nodes.keys())
                # Build a map of node IDs to labels for better context
                for node_id, node_data in nodes.items():
                    if isinstance(node_data, dict) and "data" in node_data:
                        label = node_data.get("data", {}).get("label", "")
                        if label:
                            node_labels_map[node_id] = label

        # Regenerate answer with node IDs from the new mindmap
        if new_node_ids:
            # Create a more helpful list showing node IDs with their labels
            node_info_list = []
            for node_id in new_node_ids:
                label = node_labels_map.get(node_id, "")
                if label:
                    node_info_list.append(f"{node_id} (label: '{label}')")
                else:
                    node_info_list.append(node_id)

            node_ids_str = "\n".join(node_info_list)
            final_prompt = (
                f"{prompt}\n\n"
                f"IMPORTANT: A mindmap has just been generated with the following nodes. "
                f"You MUST include references to these nodes in your response using the hash-based format [**text**](#node/node-id).\n"
                f"Use the EXACT node IDs shown below - do not modify or abbreviate them.\n"
                f"\n"
                f"Available nodes from the generated mindmap:\n"
                f"{node_ids_str}\n"
                f"\n"
                f"CRITICAL: When referencing nodes, use the EXACT node ID as shown above. "
                f"For example, if a node ID is 'node-1766205361492', use exactly '#node/node-1766205361492' in your reference link.\n"
                f"\n"
                f"Also include page references when available. Combine both when relevant: [**text**](#node/<nodeId>#pdf/<pageNumber>).\n"
                f"Format examples:\n"
                f"- Node only: [**Introduction**](#node/node-1766205361492)\n"
                f"- Page only: [**Page 26**](#pdf/26)\n"
                f"- Both: [**Introduction**](#node/node-1766205361492#pdf/26)\n"
                f"\n"
                f"Make sure to reference multiple nodes throughout your response to help users navigate the mindmap."
            )
            response = await model.with_structured_output(GenerateAnswer).ainvoke(
                [{"role": "user", "content": final_prompt}]
            )
    except (ValueError, KeyError, AttributeError) as e:
        # If mindmap generation fails, just continue with answer
        print(f"Failed to generate mindmap data: {e}")
        mindmap_dict = None

    # Return message with answer and optional mindmap data
    additional_kwargs = {}
    if mindmap_dict:
        additional_kwargs["mindmap_data"] = mindmap_dict

    return {
        "messages": [
            AIMessage(
                content=response.answer,
                additional_kwargs=additional_kwargs,  # Always pass dict, never None
            )
        ]
    }


MINDMAP_PROMPT = (
    "You are an AI assistant generating a professional React Flow mindmap from documents following established mindmap principles.\n"
    "User language can be different from the document's language, but the mindmap language must be the same as the document's language (can be translated if user asked to do so).\n"
    "\n"
    "MINDMAP DESIGN PRINCIPLES (MUST FOLLOW):\n"
    "\n"
    "1. CENTRAL TOPIC:\n"
    "   - Place the main/central topic at position (0, 0) or near the center\n"
    "   - Use node type 'custom' for ALL nodes including the central node\n"
    "   - This should be the overarching theme or main subject of the documents\n"
    "\n"
    "2. HIERARCHICAL STRUCTURE (PREFERENCES, NOT HARD LIMITS):\n"
    "   - DEFAULT LAYOUT: DAGRE-LIKE TREE (Top-Down/TB). This matches the frontend auto-layout toggle.\n"
    "   - Optional: Left-Right/LR layout when the user explicitly wants a horizontal flow.\n"
    "   - Main branches (level 1): Usually 3-6 branches from center (can be more if the user provides a longer explicit list)\n"
    "   - Sub-branches (level 2): Usually 2-5 sub-concepts per main branch\n"
    "   - Sub-sub-branches (level 3): Only when needed (keep them small and meaningful)\n"
    "   - Prefer a depth of 2-4 levels depending on document complexity (avoid excessive depth)\n"
    "   - Do NOT force a fixed total node/edge count. Choose the number of nodes based on the input.\n"
    "   - Each branch should represent a major theme, category, or section\n"
    "   - If document is very large, focus on TOP-LEVEL structure only (2 levels max)\n"
    "\n"
    "   SPECIAL RULE (ITEM LIST -> NODE COUNT):\n"
    "   - If the user request contains an explicit list of items (numbered list or bullet list) that should become nodes,\n"
    "     create EXACTLY 1 node per listed item (plus an optional single central topic node if appropriate).\n"
    "   - Preserve the order of items and do NOT merge/split items unless the user explicitly asks.\n"
    "\n"
    "3. KEYWORDS & LABELS:\n"
    "   - Use concise keywords (1-3 words maximum per node)\n"
    "   - Avoid full sentences - use nouns, short phrases, or key concepts\n"
    "   - Labels should be clear, memorable, and capture the essence\n"
    "   - Use action verbs or descriptive terms when appropriate\n"
    "\n"
    "4. DAGRE-FRIENDLY SPACING (CRITICAL):\n"
    "   - The frontend can auto-layout nodes using a Dagre TB/LR layout.\n"
    "   - You MUST still provide reasonable initial positions to avoid overlap before layout is applied.\n"
    "   - Default (TB):\n"
    "       * Use a layered tree: center at (0,0), level-1 around y≈300..500, level-2 around y≈800..1100, level-3 around y≈1400..1700\n"
    "       * Spread siblings horizontally with large gaps: 300..600px depending on label length.\n"
    "   - Optional (LR):\n"
    "       * Use left-to-right layering: center at (0,0), level-1 around x≈300..500, level-2 around x≈800..1100, level-3 around x≈1400..1700\n"
    "       * Spread siblings vertically with large gaps: 250..500px.\n"
    "   - Anti-overlap guideline:\n"
    "       * Keep at least 200px horizontal separation OR 160px vertical separation between node bounding boxes.\n"
    "       * If labels are long, increase node width and increase spacing accordingly.\n"
    "\n"
    "5. COLOR CODING:\n"
    "   - Assign different colors to different main branches for visual distinction\n"
    "   - Use consistent colors within each branch (parent and children share similar color scheme)\n"
    "   - Use node data.color (backgroundColor) for branch colors (e.g., '#E3F2FD', '#F3E5F5', '#E8F5E9', '#FFF3E0', '#FCE4EC')\n"
    "   - For EVERY edge, set style.stroke to be CLOSELY RELATED to the PARENT node's background color (data.color), so label background and edge color feel connected\n"
    "   - If you use a custom label text color (data.textColor), keep enough contrast between edge color, node background, and label text so everything stays readable\n"
    "   - Central node can have a distinct, prominent color\n"
    "\n"
    "6. EDGE STYLING & TYPES (USE VARIETY FOR VISUAL INTEREST):\n"
    "   - Available edge types: 'default', 'straight', 'step', 'smoothstep', 'simplebezier'\n"
    "   - DEFAULT edge type: always set to 'simplebezier' unless you intentionally choose another type; never leave empty\n"
    "   - Use 'smoothstep' only when you want the stepped curve style for hierarchy\n"
    "   - Use 'simplebezier' for most connections (main and secondary) to keep curves smooth\n"
    "   - Use 'step' for right-angle connections when you want a structured, organized look\n"
    "   - Use 'straight' for direct, non-hierarchical relationships or when emphasizing direct connections\n"
    "   - Use 'default' sparingly, mainly for simple direct connections when curves are unnecessary\n"
    "   - MIX different edge types thoughtfully; start with 'simplebezier' and override only when needed\n"
    "   - HIERARCHY-BASED STROKE WIDTH (VERY IMPORTANT):\n"
    "       * Center -> level-1 main branches: use edge style.strokeWidth of 3 (thick, very important)\n"
    "       * Level-1 -> level-2 branches: use strokeWidth of 2 (medium, important)\n"
    "       * Level-2 -> level-3 branches: use strokeWidth of 1 (thin, less important)\n"
    "   - Main branches from center: prefer 'simplebezier' (fallback: 'smoothstep' if you want stepped curvature)\n"
    "   - Sub-branches: mix 'simplebezier' or 'step' based on relationship type\n"
    "   - Cross-connections between branches: use 'simplebezier' or 'straight'\n"
    "   - ALWAYS match edge colors (style.stroke) to their parent branch colors (node data.color) so users can see which branch an edge belongs to\n"
    "\n"
    "7. CONTENT ANALYSIS & SUMMARIZATION (CRITICAL FOR LARGE DOCUMENTS):\n"
    "   - FIRST: Summarize and extract ONLY the most important high-level concepts\n"
    "   - For large documents (100+ pages), focus on MAIN SECTIONS/CHAPTERS only\n"
    "   - Identify the main topic from the documents\n"
    "   - Extract 3-5 major themes/categories/sections as main branches (NO MORE)\n"
    "   - For each main branch, extract ONLY 2-4 most important sub-concepts (NOT all details)\n"
    "   - Focus on hierarchical relationships (parent-child, general-specific)\n"
    "   - PRIORITIZE: Only include concepts that are central to understanding the document\n"
    "   - EXCLUDE: Minor details, examples, specific cases, lengthy explanations\n"
    "   - EXCLUDE: Repetitive information, redundant concepts\n"
    "   - Think BIG PICTURE: What are the main ideas someone needs to understand?\n"
    "   - Maintain logical flow and coherence at high level only\n"
    "\n"
    "8. JSON FORMAT REQUIREMENTS (CRITICAL):\n"
    "   - nodes MUST be a dictionary/object where keys are node IDs (e.g., 'node-1766205361492')\n"
    "   - edges MUST be a dictionary/object where keys are edge IDs (e.g., 'edge-123')\n"
    "   - Each node MUST have:\n"
    "     * id: string (same as the dictionary key)\n"
    "     * type: 'custom' (ALWAYS use 'custom' for all nodes)\n"
    "     * position: object with 'x' and 'y' as numbers\n"
    "     * width: number (e.g., 150)\n"
    "     * height: number (e.g., 50)\n"
    "     * data: object with:\n"
    "       - 'label' (string, required): The node text\n"
    "       - 'shape' (string, optional): Visual shape for the node. MUST be one of: 'rectangle', 'square', 'circle', 'diamond'.\n"
    "           * Use 'rectangle' as the default for most nodes.\n"
    "           * Use 'square' for compact, important concepts (e.g., main categories).\n"
    "           * Use 'circle' for hubs, highly central concepts, or grouped ideas.\n"
    "           * Use 'diamond' for nodes that represent decisions, conditions, or branching logic.\n"
    "           * ALWAYS choose a shape that matches the node's role in the mindmap.\n"
    "       - 'color' (string, optional): Background color hex code (e.g., '#E3F2FD') or empty string for default\n"
    "       - 'fontFamily' (string, optional): Font family name. MUST be one of: 'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'. Leave empty for default (Inter)\n"
    "       - 'fontSize' (number, optional): Font size in pixels (e.g., 14, 16, 18) or 0 for default\n"
    "       - 'fontWeight' (string, optional): Font weight (e.g., 'normal', 'bold', '600', '700') or empty string for default\n"
    "       - 'fontStyle' (string, optional): Font style (e.g., 'normal', 'italic') or empty string for default\n"
    "       - 'textDecoration' (string, optional): Text decoration (e.g., 'none', 'underline') or empty string for default\n"
    "       - 'textColor' (string, optional): Text color hex code (e.g., '#000000' for black, '#ffffff' for white). CRITICAL: MUST ALWAYS set when color is provided. If background is light, use dark text (#000000). If background is dark, use light text (#ffffff). NEVER leave empty when color is set. Leave empty ONLY when color is also empty.\n"
    "       - 'pageReference' (number, REQUIRED): The PDF page number where this node's content appears.\n"
    "         * HOW TO FIND: In the document context, each paragraph starts with a [Page X] label.\n"
    "         * Rule: If the node content is extracted from text under the [Page 10] label, set pageReference to 10.\n"
    "         * MANDATORY: All child nodes MUST have actual page numbers from the document. Only the central node is allowed to be 0 if it covers the entire document.\n"
    "         * If a node relates to multiple pages, choose the page number of the most significant information.\n"
    "     * measured: object with 'width' (number, e.g., 150) and 'height' (number, e.g., 50)\n"
    "   - Each edge MUST have:\n"
    "     * id: string (format: 'xy-edge__{{source}}-{{target}}' or custom, same as the dictionary key)\n"
    "     * source: string (source node ID)\n"
    "     * target: string (target node ID)\n"
    "     * type: string (one of: 'default', 'straight', 'step', 'smoothstep', 'simplebezier')\n"
    "     * style: object (e.g., {{'stroke': '#FFB74D', 'strokeWidth': '1'}})\n"
    "     * animated: boolean (true or false) - use true for emphasis or visual interest\n"
    "     * data: object with:\n"
    "       - 'label' (string, optional): Edge label text or empty string if no label\n"
    "       - 'labelFontFamily' (string, optional): Font family for edge label. MUST be one of: 'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'. Leave empty for default (Inter)\n"
    "       - 'labelFontSize' (number, optional): Font size for edge label in pixels (e.g., 12, 14) or 0 for default\n"
    "   - Example edge format:\n"
    "     'xy-edge__node-1766209382911-node-1766209382477': {{\n"
    "       'source': 'node-1766209382911',\n"
    "       'target': 'node-1766209382477',\n"
    "       'id': 'xy-edge__node-1766209382911-node-1766209382477',\n"
    "       'type': 'simplebezier',\n"
    "       'animated': false,\n"
    "       'data': {{'label': 'related to', 'labelFontFamily': 'Inter', 'labelFontSize': 12}}\n"
    "     }}\n"
    "   - Example node format:\n"
    "     'node-1766205361492': {{\n"
    "       'id': 'node-1766205361492',\n"
    "       'type': 'custom',\n"
    "       'position': {{'x': 0, 'y': 0}},\n"
    "       'width': 180,\n"
    "       'height': 60,\n"
    "       'data': {{\n"
    "         'label': 'New Node',\n"
    "         'color': '#E3F2FD',\n"
    "         'fontFamily': 'Inter',\n"
    "         'fontSize': 16,\n"
    "         'fontWeight': 'bold',\n"
    "         'fontStyle': 'normal',\n"
    "         'textDecoration': 'none',\n"
    "         'textColor': '#000000',\n"
    "         'pageReference': 0,\n"
    "         'shape': 'rectangle',\n"
    "       }},\n"
    "       'measured': {{'width': 180, 'height': 60}}\n"
    "     }}\n"
    "\n"
    "9. REACT FLOW FEATURES & STYLING:\n"
    "   - Use node.type='custom' for ALL nodes (never use 'input', 'default', or 'output')\n"
    "   - Use VARIETY of edge types: 'smoothstep' (most common for hierarchy), 'simplebezier' (smooth curves), 'step' (structured), 'straight' (direct), 'default' (simple)\n"
    "   - Mix edge types throughout the mindmap to create visual interest and hierarchy\n"
    "   - NODE STYLING:\n"
    "     * Use node.data.color for background color (hex format, e.g., '#E3F2FD')\n"
    "     * Use node.data.textColor for text color (hex format, e.g., '#000000' for black, '#ffffff' for white). CRITICAL: MUST ALWAYS set textColor when color (background) is provided. If background is light (e.g., '#E3F2FD', '#F3E5F5'), use dark text (#000000). If background is dark (e.g., '#1a1a1a'), use light text (#ffffff). NEVER leave textColor empty when color is set - this causes poor contrast. Leave empty ONLY when color is also empty (using default theme).\n"
    "     * Use node.data.pageReference for PDF page number (integer, e.g., 26, 96). MANDATORY: Must be extracted from the [Page X] label in context. Do not leave empty or use 0 for specific content nodes.\n"
    "     * Use node.data.fontFamily to set font. MUST be one of: 'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'. Default is 'Inter'\n"
    "     * Use node.data.fontSize for font size in pixels (e.g., 14, 16, 18, 20)\n"
    "     * Use node.data.fontWeight for emphasis: 'normal', 'bold', '600', '700' (use 'bold' for important nodes like center or main branches)\n"
    "     * Use node.data.fontStyle: 'normal' or 'italic' (use 'italic' sparingly for emphasis)\n"
    "     * Use node.data.textDecoration: 'none' or 'underline' (use 'underline' sparingly)\n"
    "     * NODE SHAPES (IMPORTANT FOR SEMANTICS):\n"
    "       - Use node.data.shape to control the visual shape. Allowed values: 'rectangle', 'square', 'circle', 'diamond'.\n"
    "       - Recommended conventions:\n"
    "           * Central node (main topic): 'circle' or 'square' to make it visually distinct.\n"
    "           * Main branches (level 1): 'rectangle' or 'square'.\n"
    "           * Regular sub-branches (details): 'rectangle'.\n"
    "           * Decision / condition / branching nodes: 'diamond'.\n"
    "           * Grouped or highly central hubs (connecting many branches): 'circle'.\n"
    "       - Be consistent: nodes with similar roles should share the same shape.\n"
    "     * Central node and main branches: Consider using larger fontSize (18-20), bold fontWeight for hierarchy\n"
    "     * Sub-branches: Use medium fontSize (14-16), normal fontWeight\n"
    "   - EDGE STYLING:\n"
    "     * Use edge.style.stroke and edge.style.strokeWidth for visual hierarchy\n"
    "     * Use edge.animated: true for important connections or visual emphasis, false for regular connections\n"
    "     * Use edge.data.label for edge labels when relationships need clarification (e.g., 'contains', 'leads to', 'related to')\n"
    "     * Use edge.data.labelFontFamily for edge label font. MUST be one of: 'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'. Default is 'Inter'\n"
    "     * Use edge.data.labelFontSize for edge label size in pixels (e.g., 12, 14)\n"
    "     * Use edge.data.labelBackgroundColor for edge label background (hex format, e.g., '#E3F2FD'). Leave empty for default card color.\n"
    "     * Use edge.data.labelColor for edge label text color (hex format, e.g., '#000000' for black, '#ffffff' for white). CRITICAL: MUST ALWAYS set labelColor when labelBackgroundColor is provided. If labelBackgroundColor is light (e.g., '#E3F2FD', '#F3E5F5'), use dark text (#000000). If labelBackgroundColor is dark (e.g., '#1a1a1a'), use light text (#ffffff). NEVER leave labelColor empty when labelBackgroundColor is set - this causes poor contrast. Leave empty ONLY when labelBackgroundColor is also empty (using default theme).\n"
    "     * Only add edge labels when they add meaningful information about the relationship\n"
    "\n"
    "10. LAYOUT CALCULATION (SPACIOUS & EVEN POSITIONING):\n"
    "   - Center node: position (0, 0) or near center\n"
    "   - Layout style: You can use radial, free-form, or hybrid - choose what creates the most spacious layout\n"
    "   - For radial layout with N main branches:\n"
    "     * Distribute at equal angles: 360°/N intervals\n"
    "     * Use LARGE, EVEN distances: 500-800 pixels from center (NOT 250-400)\n"
    "     * Calculate: x = distance * cos(angle), y = distance * sin(angle)\n"
    "   - For grid-like / free-form layout with even spacing:\n"
    "     * Think in terms of a virtual grid with step 400-500 pixels.\n"
    "     * For main branches at same level, use coordinates with equal gaps, e.g.:\n"
    "         (-800, 0), (-400, 0), (0, 0), (400, 0), (800, 0)\n"
    "     * For vertical stacking, use:\n"
    "         (0, -600), (0, -200), (0, 200), (0, 600)\n"
    "     * Avoid irregular, arbitrary spacing (like 123, 287, 359) for siblings; prefer clean, rounded coordinates with equal differences.\n"
    "   - Sub-branches: Position 400-600 pixels from parent using the same grid step logic.\n"
    "   - Sub-sub-branches: Position 400-600 pixels from parent.\n"
    "   - IMPORTANT: When calculating positions, always ensure minimum 400 pixels distance between ANY two nodes.\n"
    "   - Use the full canvas space - spread nodes from -1000 to +1000 on both axes if needed.\n"
    "   - Better to have nodes too far apart than too close together.\n"
    "\n"
    "11. EXISTING DATA HANDLING:\n"
    "    - If user provided existing mindmap data, analyze and extend it logically\n"
    "    - Preserve existing structure when appropriate\n"
    "    - Add new branches or nodes based on new content\n"
    "    - Maintain consistency in styling and layout\n"
    "\n"
    "12. SIZE OPTIMIZATION (PREFERENCES):\n"
    "    - Prefer a readable mindmap over a dense one.\n"
    "    - Do NOT enforce a strict node/edge maximum; size should match the input.\n"
    "    - If the user provides an explicit item list, create 1 node per item even if it exceeds typical targets.\n"
    "    - If document is very large (200+ pages), use only 2 hierarchy levels (center + main branches)\n"
    "    - If document is extremely large (400+ pages), focus on chapter/section titles only\n"
    "    - Quality over quantity: Better to have fewer, well-chosen nodes than many confusing ones\n"
    "    - When in doubt, choose the most important concepts and skip the rest\n"
    "    - NODE SIZE VS TEXT (CRITICAL):\n"
    "        * Nodes MUST be large enough to contain their label text plus padding.\n"
    "        * For short labels (<= 15 characters): width >= 150, height >= 50.\n"
    "        * For medium labels (16-30 characters): width >= 200, height >= 60.\n"
    "        * For long labels (> 30 characters): width >= 260, height >= 70.\n"
    "        * NEVER set width < 120 or height < 40.\n"
    "        * If you are unsure, prefer slightly larger nodes rather than smaller.\n"
    "\n"
    "13. CONTENT SELECTION STRATEGY:\n"
    "    - For large documents, create mindmap based on TABLE OF CONTENTS or SECTION STRUCTURE\n"
    "    - Focus on organizational structure rather than detailed content\n"
    "    - Group related concepts together rather than listing everything\n"
    "    - Use main branches for major sections/chapters\n"
    "    - Use sub-branches for key topics within each section (not all topics)\n"
    "    - Skip examples, case studies, detailed explanations, footnotes\n"
    "    - Think: 'What would be in a book's table of contents?'\n"
    "\n"
    "14. PAGE ASSIGNMENT STRATEGY (MANDATORY):\n"
    "    - AI MUST perform a check: 'On which page does the information for node [Node Name] first or most prominently appear?'\n"
    "    - Never leave pageReference empty. If the information is a summary, AI must assign the page number of the corresponding chapter or main section in the document.\n"
    "    - Example: If the node is 'Protein Structure' and this information is primarily described on page 15, pageReference MUST be 15.\n"
    "\n"
    "User request:\n"
    "{request}\n"
    "\n"
    "Documents context:\n"
    "{context}\n"
    "\n"
    "IMPORTANT: The document context may be very long. You MUST:\n"
    "1. First, identify the high-level structure (chapters, main sections, major topics)\n"
    "2. Extract ONLY the most important concepts at each level\n"
    "3. Create a mindmap sized appropriately for the content (do NOT force a fixed node count)\n"
    "4. Focus on the BIG PICTURE, not details\n"
    "5. If the document has many pages, prioritize organizational structure over content details\n"
    "\n"
    "CRITICAL SPACING REQUIREMENTS:\n"
    "- MINIMUM distance between ANY two nodes: 400 pixels (preferably 500-600 pixels)\n"
    "- Use the full canvas space - spread nodes widely from -1000 to +1000 on both x and y axes\n"
    "- Do NOT cluster nodes together - distribute them with generous spacing\n"
    "- Each node needs 'breathing room' - ensure ample space around every node\n"
    "- Layout can be radial, free-form, horizontal, vertical, or hybrid - choose what creates the most spacious arrangement\n"
    "- Better to have nodes too far apart than too close together\n"
    "- Think of the mindmap as needing to look spacious and uncluttered, like a well-designed infographic\n"
    "\n"
    "Existing mindmap data (if any):\n"
    "{data}\n"
    "\n"
    "Generate a mindmap that follows ALL the principles above, creating a clear, hierarchical, visually organized representation of the document content.\n"
    "REMEMBER: Less is more. A simple, clear mindmap with key concepts is better than a cluttered one with everything.\n"
)


SUMMARIZE_PROMPT = (
    "You are a summarizer summarizing a list of documents. \n"
    "Here is the list of documents: \n\n {documents} \n\n"
    "Summarize the documents by breaking them into their main sections, from top to bottom, and provide a concise summary for each section. \n"
    "Focus on the main ideas and key points of the documents, and provide a concise summary for each section. \n"
    "The summary should be in the same language as the documents but can be translated to the user's language if user asked to do so. \n"
)


class SummarizeDocuments(BaseModel):
    """Summarize the documents."""

    summary: str = Field(default="", description="The summary of the documents")


async def summarize_documents(
    state: State,
):
    """Summarize the documents."""

    writer = get_stream_writer()
    writer({"current_status": "Summarizing documents..."})

    documents = "\n".join([doc.page_content for doc in state["context"]])
    prompt = SUMMARIZE_PROMPT.format(documents=documents)
    response = await model.with_structured_output(SummarizeDocuments).ainvoke(
        [{"role": "user", "content": prompt}]
    )

    # Create a Document from the summary and update context
    summary_document = Document(
        page_content=response.summary,
        metadata={"type": "summary", "source": "summarize_documents"},
    )

    return {
        "context": [summary_document],
    }


async def route_workflow(
    state: State,
) -> Literal["load_file", "retrieve_documents"]:
    """
    Decide workflow branch based on need_initialize_data.
    - need_initialize_data = True -> load_file (reload from file)
    - need_initialize_data = False -> retrieve_documents (normal chat)
    """

    writer = get_stream_writer()
    writer({"current_status": "Calculating how the workflow should proceed..."})

    need_initialize_data = state["need_initialize_data"]

    if need_initialize_data:
        return "load_file"
    return "retrieve_documents"
