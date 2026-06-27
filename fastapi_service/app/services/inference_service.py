import io
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import HTTPException
from PIL import Image

from ..config import Settings
from ..state import InferenceState

logger = logging.getLogger(__name__)
# Ensure logger outputs to console
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter('[%(name)s] %(levelname)s: %(message)s'))
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)

try:
    import tensorflow as tf
except Exception as exc:  # pragma: no cover
    tf = None
    TF_IMPORT_ERROR = exc
else:
    TF_IMPORT_ERROR = None


def resolve_model_input_size(model: Any, default_size: int) -> int:
    input_shape = getattr(model, "input_shape", None)
    if not input_shape:
        return default_size

    if isinstance(input_shape, list):
        input_shape = input_shape[0]

    if not input_shape or len(input_shape) < 3:
        return default_size

    height = input_shape[1]
    width = input_shape[2]

    if isinstance(height, int) and isinstance(width, int) and height == width:
        return height

    return default_size


def load_labels(settings: Settings) -> list[str]:
    labels_from_env = os.getenv("CLASS_NAMES", "").strip()
    if labels_from_env:
        return [name.strip() for name in labels_from_env.split(",") if name.strip()]

    labels_path = Path(settings.labels_path)
    if labels_path.exists():
        with labels_path.open("r", encoding="utf-8") as labels_file:
            content = json.load(labels_file)
        if isinstance(content, list):
            return [str(item) for item in content]
        raise ValueError("LABELS_PATH must point to a JSON array")

    return []


def load_model(settings: Settings, state: InferenceState) -> None:
    if tf is None:
        raise RuntimeError(f"TensorFlow import failed: {TF_IMPORT_ERROR}")

    model_file = Path(settings.model_path)
    if not model_file.exists():
        raise FileNotFoundError(
            f"Model file not found at {model_file}. Export your trained .keras/.h5 model and set MODEL_PATH."
        )

    model = tf.keras.models.load_model(str(model_file))
    labels = load_labels(settings)
    input_size = resolve_model_input_size(model, settings.image_size)

    state.model = model
    state.labels = labels
    state.input_size = input_size
    state.model_loaded = True
    state.error = None


def initialize_inference(settings: Settings, state: InferenceState) -> None:
    try:
        load_model(settings, state)
        logger.info("[startup] Effective MODEL_PATH=%s", settings.model_path)
        if os.getenv("CLASS_NAMES", "").strip():
            logger.info("[startup] Labels source: CLASS_NAMES env (%d labels)", len(state.labels))
        else:
            logger.info("[startup] Labels source: LABELS_PATH=%s", settings.labels_path)
        if not state.labels:
            logger.warning(
                "[startup] No labels loaded - all predictions will return 'class_N'. "
                "Set LABELS_PATH to a JSON array file or CLASS_NAMES to a comma-separated list."
            )
        else:
            logger.info("[startup] Loaded %d labels: %s", len(state.labels), state.labels)
    except Exception as exc:  # pragma: no cover
        state.error = str(exc)
        state.model_loaded = False
        logger.error("[startup] Model initialization failed: %s", exc)
        raise RuntimeError(f"Failed to initialize inference model: {exc}") from exc


def preprocess_image(image_bytes: bytes, input_size: int) -> np.ndarray:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((input_size, input_size))
    image_array = np.asarray(image, dtype=np.float32) / 255.0
    return np.expand_dims(image_array, axis=0)


def resolve_label(state: InferenceState, index: int) -> str:
    if state.labels and 0 <= index < len(state.labels):
        return state.labels[index]
    return f"class_{index}"


def humanize_label(label: str) -> str:
    readable = label.replace("___", " - ").replace("__", " - ").replace("_", " ")
    return " ".join(readable.split())


def predict_image(content_type: str | None, content: bytes, settings: Settings, state: InferenceState) -> dict[str, Any]:
    logger.info("🔍 PREDICT_IMAGE CALLED")
    if not state.model_loaded:
        raise HTTPException(status_code=503, detail=f"Model is not ready: {state.error}")

    if not content_type or not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.max_upload_mb}MB)")

    try:
        input_tensor = preprocess_image(content, int(state.input_size or settings.image_size))
        predictions = state.model.predict(input_tensor, verbose=0)
        logger.info(f"🎯 Raw model output shape: {predictions.shape}, dtype: {predictions.dtype}")
        logger.debug(f"🎯 Raw predictions: {predictions}")
        
        probs = np.asarray(predictions[0], dtype=np.float32)
        class_index = int(np.argmax(probs))
        confidence = float(probs[class_index])
        raw_disease_name = resolve_label(state, class_index)
        disease_name = humanize_label(raw_disease_name)
        
        top_5 = sorted(enumerate(probs), key=lambda x: x[1], reverse=True)[:5]
        logger.info(f"🎯 Probabilities (top 5): {top_5}")
        logger.info(f"🎯 Class index: {class_index}, Confidence: {confidence:.4f}, Disease: {disease_name}")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc

    return {
        "diseaseName": disease_name,
        "confidence": confidence,
        "modelMeta": {
            "inputSize": state.input_size,
            "modelPath": settings.model_path,
            "classIndex": class_index,
            "rawDiseaseName": raw_disease_name,
        },
    }


def health_payload(settings: Settings, state: InferenceState) -> dict[str, Any]:
    return {
        "status": "ok" if state.model_loaded else "degraded",
        "modelLoaded": state.model_loaded,
        "modelPath": settings.model_path,
        "labelsSource": "CLASS_NAMES" if os.getenv("CLASS_NAMES", "").strip() else "LABELS_PATH",
        "inputSize": state.input_size,
        "labelsCount": len(state.labels),
        "error": state.error,
    }
