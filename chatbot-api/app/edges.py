"""Edges for the chatbot workflow."""

from typing import Literal
from pydantic import BaseModel, Field
from langgraph.config import get_stream_writer
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from app.schemas.states import State
from app.models.chat_model import model, tools_by_name

GRADE_PROMPT = (
    "You are a grader assessing relevance of a retrieved document to a user question. \n "
    "Here is the retrieved document: \n\n {context} \n\n"
    "Here is the user question: {question} \n"
    "If the document contains keyword(s) or semantic meaning related to the user question, grade it as relevant. \n"
    "Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question."
)


class GradeDocuments(BaseModel):
    """Grade documents using a binary score for relevance check."""

    binary_score: str = Field(
        default="",
        description="Relevance score: 'yes' if relevant, or 'no' if not relevant",
    )


def grade_documents(
    state: State,
) -> Literal["generate_answer", "rewrite_question"]:
    """Determine whether the retrieved documents are relevant to the question."""
    question = state["messages"][0].content
    context = "\n".join([doc.page_content for doc in state["context"]])

    prompt = GRADE_PROMPT.format(question=question, context=context)
    response = model.with_structured_output(GradeDocuments).invoke(
        [HumanMessage(content=prompt)]
    )
    score = response.binary_score

    if score == "yes":
        return "generate_answer"
    return "rewrite_question"


REWRITE_PROMPT = (
    "Look at the input and try to reason about the underlying semantic intent / meaning.\n"
    "Here is the initial question:"
    "\n ------- \n"
    "{question}"
    "\n ------- \n"
    "Formulate an improved question:"
)


def rewrite_question(state: State):
    """Rewrite the original user question."""
    question = state["messages"][0].content
    prompt = REWRITE_PROMPT.format(question=question)
    response = model.invoke([HumanMessage(content=prompt)])
    return {"messages": [HumanMessage(content=response.content)]}


GENERATE_PROMPT = (
    "You are an assistant for provided documents."
    "Use the following pieces of context to generate a reactflow mindmap from the documents, based on user request if there are any. "
    "The reactflow mindmap should be in json format. "
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


def generate_answer(state: State):
    """Generate an answer and fix reactflow mindmap data based on user request if there are any."""
    request = state["messages"][0].content
    context = "\n".join([doc.page_content for doc in state["context"]])
    prompt = GENERATE_PROMPT.format(request=request, context=context)
    response = model.with_structured_output(GenerateAnswer).invoke(
        [HumanMessage(content=prompt)]
    )
    return {"messages": [AIMessage(content=response.answer)], "data": response.data}


SUMMARIZE_PROMPT = (
    "You are a summarizer summarizing a list of documents. "
    "Here is the list of documents: \n\n {documents} \n\n"
    "Summarize the documents into a concise summary. "
)


class SummarizeDocuments(BaseModel):
    """Summarize the documents."""

    summary: str = Field(default="", description="The summary of the documents")


def summarize_documents(state: State):
    """Summarize the documents."""
    writer = get_stream_writer()
    writer.write("Summarizing documents...")
    documents = "\n".join([doc.page_content for doc in state["context"]])
    prompt = SUMMARIZE_PROMPT.format(documents=documents)
    response = model.with_structured_output(SummarizeDocuments).invoke(
        [HumanMessage(content=prompt)]
    )
    writer.write("Documents summarized successfully.")
    return {"messages": [AIMessage(content=response.summary)], "data": response.summary}


def tool_node(state: dict):
    """Performs the tool call"""

    result = []
    for tool_call in state["messages"][-1].tool_calls:
        tool = tools_by_name[tool_call["name"]]
        observation = tool.invoke(tool_call["args"])
        result.append(ToolMessage(content=observation, tool_call_id=tool_call["id"]))
    return {"messages": result}
