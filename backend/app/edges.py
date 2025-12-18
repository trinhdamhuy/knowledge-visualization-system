"""Edges for the chatbot workflow."""

from typing import Literal, List, Dict
from pydantic import BaseModel, Field

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langgraph.config import get_stream_writer

from app.schemas.states import State
from app.models.chat_model import model
from app.models.vector_store import get_vector_store


async def load_file(state: State):
    """Load a file into documents."""

    writer = get_stream_writer()
    writer({"current_status": "Loading file..."})

    file_url = state["file_url"]
    if file_url.endswith(".txt"):
        loader = TextLoader(file_url)
    elif file_url.endswith(".pdf"):
        loader = PyPDFLoader(file_url)
    else:
        writer({"current_status": "Can not load file"})
        raise ValueError("Unsupported file type")
    documents = await loader.aload()

    return {"context": documents}


async def add_documents(state: State):
    """Add documents to the vector store."""

    writer = get_stream_writer()
    writer({"current_status": "Adding documents..."})

    vector_store = get_vector_store()

    diagram_id = state["diagram_id"]
    context = state["context"]

    if not diagram_id:
        writer({"current_status": "Diagram ID not found"})
        raise ValueError("Diagram ID not found")

    # Add metadata directly to each document instead of passing separately
    for doc in context:
        if doc.metadata is None:
            doc.metadata = {}
        doc.metadata["diagram_id"] = diagram_id

    await vector_store.aadd_documents(context)

    return {"context": context}


async def retrieve_documents(state: State):
    """Retrieve documents from the vector store."""

    writer = get_stream_writer()
    writer({"current_status": "Searching for relevant documents..."})

    question = state["messages"][-1].content
    diagram_id = state["diagram_id"]
    vector_store = get_vector_store()

    retrieved_docs = await vector_store.asimilarity_search(
        question, k=5, filter={"diagram_id": diagram_id}
    )
    writer({"current_status": "Found relevant documents"})
    return {"context": retrieved_docs}


GRADE_PROMPT = (
    "You are a grader assessing relevance of a retrieved document to a user question. \n"
    "Context: \n\n {context} \n\n"
    "Here is the user question: \n\n {question} \n\n"
    "If the document contains keyword(s) or semantic meaning related to the user question, grade it as relevant. \n"
    "Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question."
)


class GradeDocuments(BaseModel):
    """Grade documents using a binary score for relevance check."""

    binary_score: str = Field(
        default="",
        description="Relevance score: 'yes' if relevant, or 'no' if not relevant",
    )


async def grade_documents(
    state: State,
) -> Literal["generate_answer", "rewrite_question", "no_relevant_data"]:
    """Run LLM to grade relevance and store the result in the state."""
    question = state["messages"][-1].content
    context_docs = state["context"]

    # Check if no documents were retrieved
    if not context_docs or len(context_docs) == 0:
        return "no_relevant_data"

    context = "\n".join([doc.page_content for doc in context_docs])

    prompt = GRADE_PROMPT.format(question=question, context=context)
    response = await model.with_structured_output(GradeDocuments).ainvoke(
        [{"role": "user", "content": prompt}]
    )
    score = response.binary_score

    if score == "yes":
        return "generate_answer"
    return "rewrite_question"


REWRITE_PROMPT = (
    "Look at the input and try to reason about the underlying semantic intent / meaning. \n"
    + "Here is the initial question: \n\n {question} \n\n"
    + "Formulate an improved question: \n\n"
)


async def rewrite_question(state: State):
    """Rewrite the original user question."""
    question = state["messages"][-1].content
    prompt = REWRITE_PROMPT.format(question=question)
    response = await model.ainvoke([{"role": "user", "content": prompt}])
    return {"messages": [HumanMessage(content=response.content)]}


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
    "User request:\n"
    "{request}\n"
    "\n"
    "Documents context:\n"
    "{context}\n"
)

NO_RELEVANT_DATA_PROMPT = (
    "The user's question is not related to the available documents, or no relevant documents were found.\n"
    "Simply tell the user that you don't know or cannot answer based on the available documents.\n"
    "Keep your response brief and simple. Use the user's language.\n"
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


class Node(BaseModel):
    """React Flow node structure."""

    id: str = Field(..., description="Unique identifier for the node")
    position: Dict[str, float] = Field(
        ...,
        description="Node position with x and y coordinates. Center node should be at (0, 0) or near center. Branch nodes should radiate outward.",
    )
    data: NodeData = Field(..., description="Node data containing the label")
    type: str = Field(
        default="default",
        description="Node type for React Flow. Use 'default' for standard nodes, 'input' for root/central node, 'output' for leaf nodes.",
    )
    style: Dict[str, str] = Field(
        default_factory=dict,
        description="Optional CSS styles for the node (e.g., backgroundColor, color, fontSize, border). Use colors to differentiate branches.",
    )


class Edge(BaseModel):
    """React Flow edge structure."""

    id: str = Field(..., description="Unique identifier for the edge")
    source: str = Field(..., description="ID of the source node (parent)")
    target: str = Field(..., description="ID of the target node (child)")
    type: str = Field(
        default="smoothstep",
        description="Edge type for React Flow. Use 'smoothstep' for curved hierarchical connections, 'straight' for direct connections, 'step' for right-angle connections.",
    )
    animated: bool = Field(
        default=False,
        description="Whether the edge should be animated. Use true for important connections.",
    )
    style: Dict[str, str] = Field(
        default_factory=dict,
        description="Optional CSS styles for the edge (e.g., stroke, strokeWidth). Use colors to match parent node branches.",
    )


class MindmapData(BaseModel):
    """React Flow mindmap data structure."""

    nodes: List[Node] = Field(..., description="List of nodes in the mindmap")
    edges: List[Edge] = Field(..., description="List of edges connecting the nodes")


async def generate_answer(state: State):
    """Generate an answer based on user request (text only, no mindmap data)."""

    request = state["messages"][0].content
    context_docs = state["context"]

    writer = get_stream_writer()
    writer({"current_status": "Generating answer..."})

    # Check if context is empty or no relevant documents
    if not context_docs or len(context_docs) == 0:
        prompt = NO_RELEVANT_DATA_PROMPT.format(request=request)
    else:
        context = "\n".join([doc.page_content for doc in context_docs])
        prompt = ANSWER_PROMPT.format(request=request, context=context)

    response = await model.with_structured_output(GenerateAnswer).ainvoke(
        [{"role": "user", "content": prompt}]
    )
    return {"messages": [AIMessage(content=response.answer)]}


MINDMAP_PROMPT = (
    "You are an AI assistant generating a professional React Flow mindmap from documents following established mindmap principles.\n"
    "User language can be different from the document's language, but the mindmap language must be the same as the document's language (can be translated if user asked to do so).\n"
    "\n"
    "MINDMAP DESIGN PRINCIPLES (MUST FOLLOW):\n"
    "\n"
    "1. CENTRAL TOPIC:\n"
    "   - Place the main/central topic at position (0, 0) or near the center\n"
    "   - Use node type 'input' for the central node\n"
    "   - This should be the overarching theme or main subject of the documents\n"
    "\n"
    "2. HIERARCHICAL STRUCTURE (STRICT LIMITS):\n"
    "   - Create a radial, tree-like structure radiating from the center\n"
    "   - Main branches (level 1): Maximum 3-5 branches from center\n"
    "   - Sub-branches (level 2): Maximum 2-4 sub-concepts per main branch\n"
    "   - Sub-sub-branches (level 3): ONLY if absolutely essential, maximum 2-3 per sub-branch\n"
    "   - MAXIMUM DEPTH: 3 levels total (center -> main branch -> sub-branch -> sub-sub-branch)\n"
    "   - TOTAL NODES LIMIT: Maximum 30-40 nodes total (including center)\n"
    "   - TOTAL EDGES LIMIT: Maximum 35-45 edges total\n"
    "   - Each branch should represent a major theme, category, or section\n"
    "   - If document is very large, focus on TOP-LEVEL structure only (2 levels max)\n"
    "\n"
    "3. KEYWORDS & LABELS:\n"
    "   - Use concise keywords (1-3 words maximum per node)\n"
    "   - Avoid full sentences - use nouns, short phrases, or key concepts\n"
    "   - Labels should be clear, memorable, and capture the essence\n"
    "   - Use action verbs or descriptive terms when appropriate\n"
    "\n"
    "4. VISUAL ORGANIZATION & SPACING (CRITICAL):\n"
    "   - Use GENEROUS spacing between all nodes - minimum 400-600 pixels between any two nodes\n"
    "   - Nodes should NEVER be placed too close together - maintain wide, comfortable spacing\n"
    "   - Layout can be flexible: radial, free-form, or hybrid - whatever creates the most spacious arrangement\n"
    "   - You are NOT restricted to strict radial or waterfall layouts - use free-form positioning for optimal spacing\n"
    "   - Main branches: Position 500-800 pixels from center node for comfortable spacing\n"
    "   - Sub-branches: Position 400-600 pixels from their parent nodes\n"
    "   - Sub-sub-branches: Position 400-600 pixels from their parent nodes\n"
    "   - Spread nodes across a wide canvas area - use the full available space\n"
    "   - Avoid clustering nodes together - distribute them widely\n"
    "   - Think of nodes as needing their own 'breathing room' - each node should have ample space around it\n"
    "   - If using radial layout, increase angles and distances significantly\n"
    "   - If using free-form layout, spread nodes horizontally and vertically with large gaps\n"
    "   - Minimum distance between any two nodes: 400 pixels (preferably 500-600 pixels)\n"
    "   - The mindmap should look spacious and uncluttered, not cramped\n"
    "\n"
    "5. COLOR CODING:\n"
    "   - Assign different colors to different main branches for visual distinction\n"
    "   - Use consistent colors within each branch (parent and children share similar color scheme)\n"
    "   - Use node style.backgroundColor for branch colors (e.g., '#E3F2FD', '#F3E5F5', '#E8F5E9', '#FFF3E0', '#FCE4EC')\n"
    "   - Use edge style.stroke to match parent node colors\n"
    "   - Central node can have a distinct, prominent color\n"
    "\n"
    "6. EDGE STYLING:\n"
    "   - Use edge type 'smoothstep' for curved, organic-looking connections\n"
    "   - Use 'straight' only for direct, non-hierarchical relationships\n"
    "   - Match edge colors to their parent branch colors\n"
    "   - Use edge style.strokeWidth of 2-3 for main branches, 1-2 for sub-branches\n"
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
    "8. REACT FLOW FEATURES:\n"
    "   - Use node.type='input' for central node, 'default' for others\n"
    "   - Use edge.type='smoothstep' for hierarchical connections\n"
    "   - Apply node.style.backgroundColor for color coding\n"
    "   - Use edge.style.stroke and edge.style.strokeWidth for visual hierarchy\n"
    "   - Set edge.animated=true for important or key relationships\n"
    "\n"
    "9. LAYOUT CALCULATION (SPACIOUS POSITIONING):\n"
    "   - Center node: position (0, 0) or near center\n"
    "   - Layout style: You can use radial, free-form, or hybrid - choose what creates the most spacious layout\n"
    "   - For radial layout with N main branches:\n"
    "     * Distribute at angles: 360°/N intervals\n"
    "     * Use LARGE distances: 500-800 pixels from center (NOT 250-400)\n"
    "     * Calculate: x = distance * cos(angle), y = distance * sin(angle)\n"
    "   - For free-form layout:\n"
    "     * Spread nodes widely across the canvas\n"
    "     * Use horizontal spacing: minimum 500-600 pixels between nodes on same level\n"
    "     * Use vertical spacing: minimum 400-500 pixels between levels\n"
    "     * Position nodes at coordinates like: (-800, 0), (-400, 0), (400, 0), (800, 0) for horizontal spread\n"
    "     * Or: (0, -600), (0, -200), (0, 200), (0, 600) for vertical spread\n"
    "   - Sub-branches: Position 400-600 pixels from parent (NOT 200-300)\n"
    "   - Sub-sub-branches: Position 400-600 pixels from parent\n"
    "   - IMPORTANT: When calculating positions, always ensure minimum 400 pixels distance between ANY two nodes\n"
    "   - Use the full canvas space - spread nodes from -1000 to +1000 on both axes if needed\n"
    "   - Better to have nodes too far apart than too close together\n"
    "\n"
    "10. EXISTING DATA HANDLING:\n"
    "    - If user provided existing mindmap data, analyze and extend it logically\n"
    "    - Preserve existing structure when appropriate\n"
    "    - Add new branches or nodes based on new content\n"
    "    - Maintain consistency in styling and layout\n"
    "\n"
    "11. SIZE OPTIMIZATION (MANDATORY):\n"
    "    - ABSOLUTE MAXIMUM: 40 nodes, 45 edges\n"
    "    - TARGET: 20-30 nodes for optimal readability\n"
    "    - If document is very large (200+ pages), use only 2 hierarchy levels (center + main branches)\n"
    "    - If document is extremely large (400+ pages), focus on chapter/section titles only\n"
    "    - Quality over quantity: Better to have fewer, well-chosen nodes than many confusing ones\n"
    "    - When in doubt, choose the most important concepts and skip the rest\n"
    "\n"
    "12. CONTENT SELECTION STRATEGY:\n"
    "    - For large documents, create mindmap based on TABLE OF CONTENTS or SECTION STRUCTURE\n"
    "    - Focus on organizational structure rather than detailed content\n"
    "    - Group related concepts together rather than listing everything\n"
    "    - Use main branches for major sections/chapters\n"
    "    - Use sub-branches for key topics within each section (not all topics)\n"
    "    - Skip examples, case studies, detailed explanations, footnotes\n"
    "    - Think: 'What would be in a book's table of contents?'\n"
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
    "3. Create a mindmap with MAXIMUM 30-40 nodes total\n"
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


async def generate_mindmap_data(state: State):
    """Generate React Flow mindmap data based on user request and documents."""

    writer = get_stream_writer()
    writer({"current_status": "Generating mindmap data..."})

    request = state["messages"][-1].content
    context_docs = state["context"]
    data = state["messages"][-1].additional_kwargs["mindmap_data"] or {}

    # Check if context contains a summary document (from summarize_documents)
    # If summary exists, use it; otherwise use original documents
    if context_docs and len(context_docs) > 0:
        # Check if the first document is a summary
        first_doc = context_docs[0]
        if first_doc.metadata.get("type") == "summary":
            # Use the summary from summarize_documents
            context = first_doc.page_content
        else:
            # Use original documents (fallback for direct generate_mindmap_data calls)
            full_context = "\n".join([doc.page_content for doc in context_docs])

            # If context is very long, create a high-level summary for mindmap generation
            if len(full_context) > 50000:
                # Create a summary focusing on structure and main topics
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
                context = summary_response.content
            else:
                context = full_context
    else:
        context = ""

    prompt = MINDMAP_PROMPT.format(
        request=request,
        context=context,
        data=data,
    )

    # Use structured output to ensure valid JSON format
    response = await model.with_structured_output(MindmapData).ainvoke(
        [{"role": "user", "content": prompt}]
    )

    # Convert to dict for JSON serialization
    mindmap_dict = response.model_dump()

    return {
        "messages": [
            AIMessage(
                name="mindmap",
                content="Mindmap generated successfully",
                additional_kwargs={"mindmap_data": mindmap_dict},
            )
        ]
    }


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


async def route_mode(
    state: State,
) -> Literal["load_file", "generate_mindmap_data", "retrieve_documents"]:
    """
    Decide workflow branch based on user-provided mode and file conditions.
    - mode = "generate" + need_initialize_data -> load_file
    - mode = "generate" + not need_initialize_data -> generate_mindmap_data
    - mode = "chat" -> retrieve_documents
    """

    writer = get_stream_writer()
    writer({"current_status": "Calculating how the workflow should proceed..."})

    mode = state["mode"]
    need_initialize_data = state["need_initialize_data"]

    if mode == "generate":
        if need_initialize_data:
            return "load_file"
        else:
            return "generate_mindmap_data"
    else:
        return "retrieve_documents"
