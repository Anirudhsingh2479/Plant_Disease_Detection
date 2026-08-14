import io
import json
import logging
import os
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import HTTPException
from PIL import Image

from ..config import Settings
from ..state import InferenceState

logger = logging.getLogger(__name__)

tf = None
TF_IMPORT_ERROR: Exception | None = None


def get_tensorflow() -> Any:
    global tf
    global TF_IMPORT_ERROR

    if tf is not None:
        return tf

    try:
        import tensorflow as tensorflow_module
    except Exception as exc:  # pragma: no cover
        TF_IMPORT_ERROR = exc
        raise RuntimeError(f"TensorFlow import failed: {exc}") from exc

    tf = tensorflow_module
    TF_IMPORT_ERROR = None
    return tf


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


def resolve_model_output_classes(model: Any) -> int | None:
    output_shape = getattr(model, "output_shape", None)
    if isinstance(output_shape, list):
        output_shape = output_shape[0]

    if output_shape and len(output_shape) >= 2 and isinstance(output_shape[-1], int):
        return int(output_shape[-1])

    return None


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
    tensorflow = get_tensorflow()

    model_file = Path(settings.model_path)
    if not model_file.exists():
        raise FileNotFoundError(
            f"Model file not found at {model_file}. Export your trained .keras/.h5 model and set MODEL_PATH."
        )

    model = tensorflow.keras.models.load_model(str(model_file))
    labels = load_labels(settings)
    input_size = resolve_model_input_size(model, settings.image_size)
    output_classes = resolve_model_output_classes(model)

    if labels and output_classes and len(labels) != output_classes:
        raise ValueError(
            f"Labels count ({len(labels)}) does not match model output classes ({output_classes}). "
            "Update labels.json or CLASS_NAMES to match the trained model."
        )

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
        logger.exception("[startup] Model initialization failed")
        raise RuntimeError(f"Failed to initialize inference model: {exc}") from exc


def preprocess_image(image_bytes: bytes, input_size: int) -> np.ndarray:
    tensorflow = get_tensorflow()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((256, 256))
    image_array = np.asarray(image, dtype=np.float32)

    height, width = image_array.shape[:2]
    crop_size = min(input_size, height, width)
    offsets = [
        ((height - crop_size) // 2, (width - crop_size) // 2),
        (0, 0),
        (0, width - crop_size),
        (height - crop_size, 0),
        (height - crop_size, width - crop_size),
    ]

    crops = []
    seen_offsets = set()
    for y_offset, x_offset in offsets:
        if (y_offset, x_offset) in seen_offsets:
            continue
        seen_offsets.add((y_offset, x_offset))

        crop = image_array[y_offset : y_offset + crop_size, x_offset : x_offset + crop_size, :]
        if crop_size != input_size:
            crop = tensorflow.image.resize(crop, (input_size, input_size)).numpy()

        crops.append(crop)
        crops.append(np.flip(crop, axis=1))

    image_batch = np.asarray(crops, dtype=np.float32)
    image_batch = tensorflow.keras.applications.resnet50.preprocess_input(image_batch)
    return np.asarray(image_batch, dtype=np.float32)


def resolve_label(state: InferenceState, index: int) -> str:
    if state.labels and 0 <= index < len(state.labels):
        return state.labels[index]
    return f"class_{index}"


def humanize_label(label: str) -> str:
    readable = label.replace("___", " - ").replace("__", " - ").replace("_", " ")
    return " ".join(readable.split())


def top_predictions(state: InferenceState, probs: np.ndarray, limit: int = 5) -> list[dict[str, Any]]:
    top_indexes = np.argsort(probs)[::-1][:limit]
    return [
        {
            "diseaseName": humanize_label(resolve_label(state, int(index))),
            "confidence": float(probs[index]),
            "classIndex": int(index),
            "rawDiseaseName": resolve_label(state, int(index)),
        }
        for index in top_indexes
    ]


def predict_image(content_type: str | None, content: bytes, settings: Settings, state: InferenceState) -> dict[str, Any]:
    logger.info("PREDICT_IMAGE CALLED")
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
        logger.info("Raw model output shape: %s, dtype: %s", predictions.shape, predictions.dtype)
        logger.debug("Raw predictions: %s", predictions)
        
        probs = np.mean(np.asarray(predictions, dtype=np.float32), axis=0)
        class_index = int(np.argmax(probs))
        confidence = float(probs[class_index])
        raw_disease_name = resolve_label(state, class_index)
        disease_name = humanize_label(raw_disease_name)

        top_5 = top_predictions(state, probs)
        logger.info("Probabilities (top 5): %s", top_5)
        logger.info("Class index: %s, Confidence: %.4f, Disease: %s", class_index, confidence, disease_name)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc

    return {
        "diseaseName": disease_name,
        "confidence": confidence,
        "topPredictions": top_5,
        "modelMeta": {
            "inputSize": state.input_size,
            "modelPath": settings.model_path,
            "classIndex": class_index,
            "rawDiseaseName": raw_disease_name,
            "predictionMode": "multi_crop_flip_average",
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
