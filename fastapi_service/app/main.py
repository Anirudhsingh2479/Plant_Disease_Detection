import logging
import sys
from threading import Thread

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import SETTINGS
from .routes import router
from .services.inference_service import initialize_inference
from .state import STATE


def configure_logging() -> None:
	logging.basicConfig(
		level=logging.INFO,
		format='[%(name)s] %(levelname)s: %(message)s',
		stream=sys.stdout,
		force=True,
	)


app = FastAPI(title="Plant Disease Inference API", version="1.0.0")

configure_logging()

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(router)


def _warmup_services() -> None:
	try:
		initialize_inference(SETTINGS, STATE)
	except Exception:
		# initialize_inference already logs and updates STATE.error
		pass

	if SETTINGS.chatbot_warmup:
		try:
			from .services.chat_service import initialize_chat_service

			initialize_chat_service()
			STATE.chatbot_ready = True
			STATE.chatbot_error = None
		except Exception as exc:
			STATE.chatbot_ready = False
			STATE.chatbot_error = str(exc)


@app.on_event("startup")
def startup_event() -> None:
	STATE.input_size = SETTINGS.image_size
	Thread(target=_warmup_services, daemon=True).start()
