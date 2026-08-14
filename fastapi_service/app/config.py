import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    base_dir: Path
    model_path: str
    labels_path: str
    image_size: int
    max_upload_mb: int
    chatbot_knowledge_path: str
    chatbot_vectorstore_path: str
    chatbot_embedding_model: str
    chatbot_llm_model: str
    chatbot_warmup: bool


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


BASE_DIR = Path(__file__).resolve().parents[1]

SETTINGS = Settings(
    base_dir=BASE_DIR,
    model_path=os.getenv("MODEL_PATH", str(BASE_DIR / "model" / "best_plant_model.keras")),
    labels_path=os.getenv("LABELS_PATH", str(BASE_DIR / "labels.json")),
    image_size=int(os.getenv("IMAGE_SIZE", "256")),
    max_upload_mb=int(os.getenv("MAX_UPLOAD_MB", "5")),
    chatbot_knowledge_path=os.getenv(
        "CHATBOT_KNOWLEDGE_PATH",
        str(BASE_DIR / "app" / "prompt" / "plant_disease.txt"),
    ),
    chatbot_vectorstore_path=os.getenv(
        "CHATBOT_CHROMA_PATH",
        os.getenv("CHATBOT_FAISS_PATH", str(BASE_DIR / "chroma_db")),
    ),
    chatbot_embedding_model=os.getenv("CHATBOT_EMBEDDING_MODEL", "sentence-transformers/all-mpnet-base-v2"),
    chatbot_llm_model=os.getenv("CHATBOT_LLM_MODEL", "gemini-3.1-flash-lite"),
    chatbot_warmup=_env_bool("CHATBOT_WARMUP", False),
)
