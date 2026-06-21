from typing import Annotated, Any

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import StreamingResponse

from .config import SETTINGS
from .schemas import ChatRequest
from .services.chat_service import create_chat_response, create_chat_stream
from .services.inference_service import health_payload, predict_image
from .state import STATE

router = APIRouter()


@router.get("/health")
def health() -> dict[str, Any]:
    return health_payload(SETTINGS, STATE)


@router.post(
    "/predict",
    responses={
        400: {"description": "Only image uploads are supported"},
        413: {"description": "Uploaded file is too large"},
        500: {"description": "Inference failed"},
        503: {"description": "Model is not loaded"},
    },
)
async def predict(file: Annotated[UploadFile, File(...)]) -> dict[str, Any]:
    content = await file.read()
    return predict_image(file.content_type, content, SETTINGS, STATE)


@router.post("/chat")
async def chat(request: ChatRequest) -> dict[str, Any]:
    return create_chat_response(
        request.user_message,
        request.detected_disease,
        request.session_id,
        request.language,
    )


@router.get(
    "/chat/stream",
    responses={
        400: {"description": "user_message is required"},
    },
)
async def chat_stream(
    user_message: str,
    detected_disease: str | None = None,
    session_id: str | None = None,
    language: str = "English",
) -> StreamingResponse:
    return create_chat_stream(user_message, detected_disease, session_id, language)
