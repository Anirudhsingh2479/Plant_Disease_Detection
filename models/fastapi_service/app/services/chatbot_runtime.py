import os
from pathlib import Path
from threading import Lock
from typing import Any

from dotenv import load_dotenv

# Chatbot embeddings run on PyTorch/SentenceTransformers; disable optional TF import path.
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_TF", "0")

from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

from langchain_community.document_loaders import TextLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter

from ..config import SETTINGS, Settings


_INIT_LOCK = Lock()
_INITIALIZED = False

_STORE: dict[str, InMemoryChatMessageHistory] = {}
_CONVERSATIONAL_RAG_CHAIN: Any | None = None


_DISEASE_ALIASES: dict[str, str] = {
    "tomato late blight": "Late Blight (Phytophthora infestans) / Potato Late Blight",
    "late blight": "Late Blight (Phytophthora infestans) / Potato Late Blight",
}


def _normalize_detected_disease(detected_disease: str | None) -> tuple[str | None, str | None]:
    if not detected_disease or not detected_disease.strip():
        return None, None

    cleaned = " ".join(detected_disease.strip().split())
    alias = _DISEASE_ALIASES.get(cleaned.lower())
    return cleaned, alias


def _get_google_api_key() -> str:
    load_dotenv()
    google_api_key = os.getenv("GOOGLE_API_KEY")

    if not google_api_key:
        try:
            from google.colab import userdata  # type: ignore

            google_api_key = userdata.get("GOOGLE_API_KEY")
        except Exception:
            pass

    if not google_api_key:
        raise ValueError("GOOGLE_API_KEY not found.")

    return google_api_key


def _get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in _STORE:
        _STORE[session_id] = InMemoryChatMessageHistory()
    return _STORE[session_id]


def _build_knowledge_path(settings: Settings) -> Path:
    disease_db_path = Path(settings.chatbot_knowledge_path)
    if not disease_db_path.is_absolute():
        disease_db_path = (settings.base_dir / disease_db_path).resolve()

    return disease_db_path


def initialize_chatbot(settings: Settings = SETTINGS) -> None:
    global _INITIALIZED
    global _CONVERSATIONAL_RAG_CHAIN

    if _INITIALIZED:
        return

    with _INIT_LOCK:
        if _INITIALIZED:
            return

        os.environ["GOOGLE_API_KEY"] = _get_google_api_key()

        disease_db_path = _build_knowledge_path(settings)

        loader = TextLoader(str(disease_db_path), encoding="utf-8")
        documents = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2500,
            chunk_overlap=200,
        )
        chunks = text_splitter.split_documents(documents)

        embeddings = HuggingFaceEmbeddings(
            model_name=settings.chatbot_embedding_model,
        )

        vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            collection_name="plant_disease_chatbot",
        )

        retriever = vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 4},
        )

        system_prompt = """
You are an expert agricultural assistant.

Use the retrieved context and previous conversation history.

If the user asks follow-up questions like:
- What more can I do?
- Any prevention?
- What medicine should I use?

understand what disease they are referring to from chat history.

if answers does not match,say i don't know the answer

Respond completely in {language}.

Formatting rules (must follow):
- Use short section headers with emojis removed.
- Put each point on a new line.
- Use '-' bullets only (not '*').
- Keep 4-7 bullets for treatment/prevention questions.
- Do not return one-paragraph responses for actionable answers.

Output template:
Answer:
<2-3 sentence direct answer>

Recommended Actions:
- <action 1>
- <action 2>
- <action 3>

Notes:
- <safety/timing note>

Context:
{context}
"""

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{input}"),
            ]
        )

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.2,
        )

        question_answer_chain = create_stuff_documents_chain(llm, prompt)
        rag_chain = create_retrieval_chain(retriever, question_answer_chain)

        _CONVERSATIONAL_RAG_CHAIN = RunnableWithMessageHistory(
            rag_chain,
            _get_session_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer",
        )

        _INITIALIZED = True


def ask_chatbot(
    user_message: str,
    detected_disease: str | None,
    session_id: str,
    language: str = "English",
) -> str:
    initialize_chatbot()

    if not user_message or not user_message.strip():
        raise ValueError("user_message cannot be empty")

    if _CONVERSATIONAL_RAG_CHAIN is None:
        raise RuntimeError("chatbot runtime not initialized")

    prompt_input = user_message.strip()
    normalized_disease, alias_disease = _normalize_detected_disease(detected_disease)
    if normalized_disease:
        if alias_disease:
            prompt_input = (
                f"Detected disease: {normalized_disease}\n"
                f"Knowledge alias: {alias_disease}\n"
                "Use the alias context for treatment/prevention if the exact disease string is not present.\n\n"
                f"User question: {prompt_input}"
            )
        else:
            prompt_input = f"Detected disease: {normalized_disease}\n\nUser question: {prompt_input}"

    response = _CONVERSATIONAL_RAG_CHAIN.invoke(
        {
            "input": prompt_input,
            "language": language or "English",
        },
        config={
            "configurable": {
                "session_id": session_id,
            }
        },
    )

    answer = response.get("answer") if isinstance(response, dict) else None
    if not isinstance(answer, str):
        raise RuntimeError("chatbot returned invalid response")

    return answer
