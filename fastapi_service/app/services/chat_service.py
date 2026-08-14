import asyncio
import json
import os
from typing import Any, AsyncGenerator

from dotenv import load_dotenv
from fastapi import HTTPException
from fastapi.responses import StreamingResponse


def initialize_chat_service() -> None:
    from .chatbot_runtime import initialize_chatbot

    initialize_chatbot()


def compose_chat_response(
    user_message: str,
    detected_disease: str | None,
    session_id: str,
    language: str,
) -> str:
    if not user_message or not user_message.strip():
        return "Please share your question so I can help you with crop advice."

    try:
        load_dotenv()
        if not os.getenv("GOOGLE_API_KEY"):
            raise RuntimeError("GOOGLE_API_KEY is missing. Add it to fastapi_service/.env to enable chatbot answers.")

        from .chatbot_runtime import ask_chatbot

        return ask_chatbot(
            user_message=user_message,
            detected_disease=detected_disease,
            session_id=session_id,
            language=language,
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Chatbot unavailable: {exc}") from exc


def create_chat_response(
    user_message: str,
    detected_disease: str | None,
    session_id: str | None,
    language: str,
) -> dict[str, Any]:
    resolved_session_id = session_id or "default"
    return {
        "bot_response": compose_chat_response(
            user_message,
            detected_disease,
            resolved_session_id,
            language,
        ),
        "session_id": resolved_session_id,
    }

# This function splits a long chatbot response into small chunks.
# It is used only for streaming.
def _chunk_text(text: str, chunk_size: int = 24) -> list[str]:
    words = text.split()
    if not words:
        return [""]

    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for word in words:
        if current_len + len(word) + 1 > chunk_size and current:
            chunks.append(" ".join(current) + " ")
            current = [word]
            current_len = len(word)
        else:
            current.append(word)
            current_len += len(word) + 1

    if current:
        chunks.append(" ".join(current) + " ")

    return chunks


def _sse_event(event: str, payload: dict[str, Any]) -> str:
    return f"event: {event}\\ndata: {json.dumps(payload, ensure_ascii=False)}\\n\\n"


async def generate_chat_events(
    user_message: str,
    detected_disease: str | None,
    session_id: str,
    language: str,
) -> AsyncGenerator[str, None]:
    yield _sse_event("start", {"session_id": session_id})

    try:
        bot_response = await asyncio.to_thread(
            compose_chat_response,
            user_message,
            detected_disease,
            session_id,
            language,
        )
    except HTTPException as exc:
        message = exc.detail if isinstance(exc.detail, str) else "Chatbot service failed."
        yield _sse_event("error", {"message": message})
        yield _sse_event("done", {"bot_response": "", "session_id": session_id})
        return
    except Exception as exc:
        yield _sse_event("error", {"message": f"Chatbot service failed: {exc}"})
        yield _sse_event("done", {"bot_response": "", "session_id": session_id})
        return

    for chunk in _chunk_text(bot_response):
        yield _sse_event("token", {"text": chunk})
        await asyncio.sleep(0.02)

    yield _sse_event("done", {"bot_response": bot_response, "session_id": session_id})


def create_chat_stream(
    user_message: str,
    detected_disease: str | None,
    session_id: str | None,
    language: str,
) -> StreamingResponse:
    if not user_message or not user_message.strip():
        raise HTTPException(status_code=400, detail="user_message is required")

    resolved_session_id = session_id or "default"

    return StreamingResponse(
        generate_chat_events(user_message, detected_disease, resolved_session_id, language),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",#It tells Nginx not to buffer the response,
                                        #so chunks reach the frontend immediately.
        },
    )
