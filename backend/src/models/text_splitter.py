"""Text splitter configuration for the chatbot."""

from langchain_text_splitters import RecursiveCharacterTextSplitter


def get_text_splitter() -> RecursiveCharacterTextSplitter:
    """Get the text splitter."""
    return RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        add_start_index=True,
    )
