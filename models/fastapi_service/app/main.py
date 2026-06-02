import io
import json
import os
from pathlib import Path
from typing import Annotated
from typing import Any

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

try:
	import tensorflow as tf
except Exception as exc:  # pragma: no cover
	tf = None
	TF_IMPORT_ERROR = exc
else:
	TF_IMPORT_ERROR = None


app = FastAPI(title="Plant Disease Inference API", version="1.0.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "model" / "best_plant_model.keras"))
LABELS_PATH = os.getenv("LABELS_PATH", "")
IMAGE_SIZE = int(os.getenv("IMAGE_SIZE", "256"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "5"))

STATE: dict[str, Any] = {
	"model": None,
	"labels": [],
	"model_loaded": False,
	"error": None,
}


def _load_labels() -> list[str]:
	labels_from_env = os.getenv("CLASS_NAMES", "").strip()
	if labels_from_env:
		return [name.strip() for name in labels_from_env.split(",") if name.strip()]

	if LABELS_PATH:
		labels_path = Path(LABELS_PATH)
		if labels_path.exists():
			with labels_path.open("r", encoding="utf-8") as labels_file:
				content = json.load(labels_file)
			if isinstance(content, list):
				return [str(item) for item in content]
			raise ValueError("LABELS_PATH must point to a JSON array")

	return []


def _load_model() -> None:
	if tf is None:
		raise RuntimeError(f"TensorFlow import failed: {TF_IMPORT_ERROR}")

	model_file = Path(MODEL_PATH)
	if not model_file.exists():
		raise FileNotFoundError(
			f"Model file not found at {model_file}. Export your trained .keras/.h5 model and set MODEL_PATH."
		)

	model = tf.keras.models.load_model(str(model_file))
	labels = _load_labels()

	STATE["model"] = model
	STATE["labels"] = labels
	STATE["model_loaded"] = True
	STATE["error"] = None


def _preprocess_image(image_bytes: bytes) -> np.ndarray:
	image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
	image = image.resize((IMAGE_SIZE, IMAGE_SIZE))
	image_array = np.asarray(image, dtype=np.float32) / 255.0
	return np.expand_dims(image_array, axis=0)


def _resolve_label(index: int) -> str:
	labels = STATE["labels"]
	if labels and 0 <= index < len(labels):
		return labels[index]
	return f"class_{index}"


@app.on_event("startup")
def startup_event() -> None:
	try:
		_load_model()
	except Exception as exc:  # pragma: no cover
		STATE["error"] = str(exc)
		STATE["model_loaded"] = False


@app.get("/health")
def health() -> dict[str, Any]:
	return {
		"status": "ok" if STATE["model_loaded"] else "degraded",
		"modelLoaded": STATE["model_loaded"],
		"modelPath": MODEL_PATH,
		"labelsCount": len(STATE["labels"]),
		"error": STATE["error"],
	}


@app.post(
	"/predict",
	responses={
		400: {"description": "Only image uploads are supported"},
		413: {"description": "Uploaded file is too large"},
		500: {"description": "Inference failed"},
		503: {"description": "Model is not loaded"},
	},
)
async def predict(file: Annotated[UploadFile, File(...)]) -> dict[str, Any]:
	if not STATE["model_loaded"]:
		raise HTTPException(status_code=503, detail=f"Model is not ready: {STATE['error']}")

	if not file.content_type or not file.content_type.startswith("image/"):
		raise HTTPException(status_code=400, detail="Only image uploads are supported")

	content = await file.read()
	max_bytes = MAX_UPLOAD_MB * 1024 * 1024
	if len(content) > max_bytes:
		raise HTTPException(status_code=413, detail=f"File too large (max {MAX_UPLOAD_MB}MB)")

	try:
		input_tensor = _preprocess_image(content)
		predictions = STATE["model"].predict(input_tensor, verbose=0)
		probs = np.asarray(predictions[0], dtype=np.float32)
		class_index = int(np.argmax(probs))
		confidence = float(probs[class_index])
		disease_name = _resolve_label(class_index)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc

	return {
		"diseaseName": disease_name,
		"confidence": confidence,
		"modelMeta": {
			"inputSize": IMAGE_SIZE,
			"modelPath": MODEL_PATH,
			"classIndex": class_index,
		},
	}

