"""Edges for the chatbot workflow."""

from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from app.schemas.states import State
from app.models.chat_model import model


async def load_file(state: State):
    """Load a file into documents."""
    file_url = state["file_url"]
    if file_url.endswith(".txt"):
        loader = TextLoader(file_url)
    elif file_url.endswith(".pdf"):
        loader = PyPDFLoader(file_url)
    else:
        raise ValueError("Unsupported file type")
    documents = await loader.aload()
    return {"context": documents}


async def add_documents(state: State, config: RunnableConfig):
    """Add documents to the vector store."""
    documents = state["context"]
    diagram_id = state["diagram_id"]
    vector_store = config["configurable"]["vector_store"]
    await vector_store.aadd_documents(documents, metadata={"diagram_id": diagram_id})
    return {"context": documents}


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
) -> Literal["generate_answer", "rewrite_question"]:
    """Determine whether the retrieved documents are relevant to the question."""
    question = state["messages"][0].content
    context = "\n".join([doc.page_content for doc in state["context"]])

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
    question = state["messages"][0].content
    prompt = REWRITE_PROMPT.format(question=question)
    response = await model.ainvoke([{"role": "user", "content": prompt}])
    return {"messages": [HumanMessage(content=response.content)]}


async def retrieve_documents(state: State, config: RunnableConfig):
    """Retrieve documents from the vector store."""
    question = state["messages"][0].content
    diagram_id = state["diagram_id"]
    vector_store = config["configurable"]["vector_store"]
    retrieved_docs = await vector_store.asimilarity_search(
        question, k=5, filter={"diagram_id": diagram_id}
    )
    return {"context": retrieved_docs}


GENERATE_PROMPT = (
    "You are an assistant for provided documents. \n"
    "Use the following pieces of context to generate a reactflow mindmap from the documents, based on user request if there are any. \n"
    "The reactflow mindmap should be in format below: \n"
    "{{nodes: [{{ id: 'n1', position: {{ x: 0, y: 0 }}, data: {{ label: 'Node 1' }} }},{{ id: 'n2', position: {{ x: 0, y: 100 }}, data: {{ label: 'Node 2' }} }},], edges: [{{ id: 'n1-n2', source: 'n1', target: 'n2' }}]}} \n"
    "Here is the user request: \n\n {request} \n\n"
    "Here is the context of the documents: \n\n {context} \n\n"
)


class GenerateAnswer(BaseModel):
    """Generate an answer and a reactflow mindmap."""

    answer: str = Field(default="", description="The answer to the question")
    data: dict = Field(
        default={},
        description="The reactflow mindmap data generated from documents in json format",
    )


async def generate_answer(state: State):
    """Generate an answer and fix reactflow mindmap data based on user request if there are any."""
    request = state["messages"][0].content
    context = "\n".join([doc.page_content for doc in state["context"]])
    prompt = GENERATE_PROMPT.format(request=request, context=context)
    response = await model.with_structured_output(GenerateAnswer).ainvoke(
        [{"role": "user", "content": prompt}]
    )
    return {"messages": [AIMessage(content=response.answer)], "data": response.data}


SUMMARIZE_PROMPT = (
    "You are a summarizer summarizing a list of documents. \n"
    "Here is the list of documents: \n\n {documents} \n\n"
    "Summarize the documents into a concise summary. \n"
)


class SummarizeDocuments(BaseModel):
    """Summarize the documents."""

    summary: str = Field(default="", description="The summary of the documents")


async def summarize_documents(
    state: State,
):
    """Summarize the documents."""
    documents = "\n".join([doc.page_content for doc in state["context"]])
    prompt = SUMMARIZE_PROMPT.format(documents=documents)
    response = await model.with_structured_output(SummarizeDocuments).ainvoke(
        [{"role": "user", "content": prompt}]
    )
    return {"messages": [AIMessage(content=response.summary)], "data": response.summary}
