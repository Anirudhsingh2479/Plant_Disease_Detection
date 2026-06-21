from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import SETTINGS
from .routes import router
from .services.chat_service import initialize_chat_service
from .services.inference_service import initialize_inference
from .state import STATE


app = FastAPI(title="Plant Disease Inference API", version="1.0.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(router)

@app.on_event("startup")
def startup_event() -> None:
	STATE.input_size = SETTINGS.image_size
	initialize_inference(SETTINGS, STATE)

	if SETTINGS.chatbot_warmup:
		try:
			initialize_chat_service()
			STATE.chatbot_ready = True
			STATE.chatbot_error = None
		except Exception as exc:
			STATE.chatbot_ready = False
			STATE.chatbot_error = str(exc)

