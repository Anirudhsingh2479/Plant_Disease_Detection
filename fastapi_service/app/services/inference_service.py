import io
import json
import logging
import numbers
import os
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import HTTPException
from PIL import Image

from ..config import Settings
from ..state import InferenceState

logger = logging.getLogger(__name__)

try:
    import onnxruntime as ort
except Exception as exc:  # pragma: no cover
    ort = None
    ONNX_IMPORT_ERROR = exc
else:
    ONNX_IMPORT_ERROR = None

try:
    import tensorflow as tf
except Exception as exc:  # pragma: no cover
    tf = None
    TF_IMPORT_ERROR = exc
else:
    TF_IMPORT_ERROR = None


def resolve_model_input_size(model: Any, default_size: int) -> int:
    input_shape = getattr(model, "input_shape", None)
    return resolve_input_size_from_shape(input_shape, default_size)


def resolve_input_size_from_shape(input_shape: Any, default_size: int) -> int:
    if not input_shape:
        return default_size

    # TensorFlow may return a list of shapes for multi-input models.
    if isinstance(input_shape, list) and input_shape and isinstance(input_shape[0], (list, tuple)):
        input_shape = input_shape[0]

    if not input_shape or len(input_shape) < 3:
        return default_size

    height = input_shape[1]
    width = input_shape[2]

    if isinstance(height, int) and isinstance(width, int) and height == width:
        return height

    return default_size


def resolve_onnx_input_spec(input_shape: Any, default_size: int) -> tuple[int, str]:
    if not input_shape:
        return default_size, "nhwc"

    # ONNX NodeArg.shape is usually a flat list [N, H, W, C] or [N, C, H, W].
    # Only unwrap when shape is nested (multi-input shape container).
    if isinstance(input_shape, list) and input_shape and isinstance(input_shape[0], (list, tuple)):
        input_shape = input_shape[0]

    if not isinstance(input_shape, (list, tuple)) or len(input_shape) < 4:
        return default_size, "nhwc"

    # Typical ONNX forms:
    # - NHWC: [N, H, W, C]
    # - NCHW: [N, C, H, W]
    _, d1, d2, d3 = input_shape[:4]

    def _is_int_dim(value: Any) -> bool:
        return isinstance(value, numbers.Integral)

    if _is_int_dim(d1) and d1 in {1, 3} and _is_int_dim(d2) and _is_int_dim(d3) and d2 == d3:
        return d2, "nchw"

    if _is_int_dim(d3) and d3 in {1, 3} and _is_int_dim(d1) and _is_int_dim(d2) and d1 == d2:
        return d1, "nhwc"

    return default_size, "nhwc"


def resolve_backend(settings: Settings) -> str:
    configured = settings.model_backend
    if configured in {"onnx", "tensorflow"}:
        return configured

    model_suffix = Path(settings.model_path).suffix.lower()
    if model_suffix == ".onnx":
        return "onnx"

    return "tensorflow"


def load_onnx_model(settings: Settings, state: InferenceState) -> None:
    if ort is None:
        raise RuntimeError(f"ONNX Runtime import failed: {ONNX_IMPORT_ERROR}")

    model_file = Path(settings.model_path)
    if not model_file.exists():
        raise FileNotFoundError(
            f"ONNX model file not found at {model_file}. Convert your model and set MODEL_PATH to a .onnx file."
        )

    session_options = ort.SessionOptions()
    session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

    providers = ["CPUExecutionProvider"]
    configured_providers = os.getenv("ONNX_PROVIDERS", "").strip()
    if configured_providers:
        providers = [provider.strip() for provider in configured_providers.split(",") if provider.strip()]

    session = ort.InferenceSession(str(model_file), sess_options=session_options, providers=providers)
    model_input = session.get_inputs()[0]
    output_name = session.get_outputs()[0].name if session.get_outputs() else None
    input_size, input_layout = resolve_onnx_input_spec(model_input.shape, settings.image_size)

    state.model = session
    state.backend = "onnx"
    state.input_name = model_input.name
    state.output_name = output_name
    state.input_layout = input_layout
    state.raw_input_shape = list(model_input.shape)
    state.input_size = input_size
    state.model_loaded = True
    state.error = None
    logger.info(
        "[startup] ONNX input name=%s shape=%s layout=%s inputSize=%s",
        state.input_name,
        state.raw_input_shape,
        state.input_layout,
        state.input_size,
    )


def load_tensorflow_model(settings: Settings, state: InferenceState) -> None:
    if tf is None:
        raise RuntimeError(f"TensorFlow import failed: {TF_IMPORT_ERROR}")

    model_file = Path(settings.model_path)
    if not model_file.exists():
        raise FileNotFoundError(
            f"Model file not found at {model_file}. Export your trained .keras/.h5 model and set MODEL_PATH."
        )

    model = tf.keras.models.load_model(str(model_file))
    input_size = resolve_model_input_size(model, settings.image_size)

    state.model = model
    state.backend = "tensorflow"
    state.input_name = None
    state.output_name = None
    state.input_layout = "nhwc"
    state.raw_input_shape = []
    state.input_size = input_size
    state.model_loaded = True
    state.error = None


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
    backend = resolve_backend(settings)
    if backend == "onnx":
        load_onnx_model(settings, state)
    else:
        load_tensorflow_model(settings, state)

    labels = load_labels(settings)
    state.labels = labels


def initialize_inference(settings: Settings, state: InferenceState) -> None:
    try:
        load_model(settings, state)
        logger.info("[startup] Effective MODEL_PATH=%s", settings.model_path)
        logger.info("[startup] Inference backend=%s", state.backend)
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


def preprocess_image(image_bytes: bytes, input_size: int, input_layout: str = "nhwc") -> np.ndarray:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((input_size, input_size), Image.Resampling.BILINEAR)
    image_array = np.asarray(image, dtype=np.float32)
    image_array = np.expand_dims(image_array, axis=0)
    # ResNet50 preprocess_input (caffe mode): RGB -> BGR and channel mean subtraction.
    image_array = image_array[..., ::-1]
    image_array[..., 0] -= 103.939
    image_array[..., 1] -= 116.779
    image_array[..., 2] -= 123.68

    if input_layout == "nchw":
        image_array = np.transpose(image_array, (0, 3, 1, 2))

    return image_array.astype(np.float32)


def resolve_label(state: InferenceState, index: int) -> str:
    if state.labels and 0 <= index < len(state.labels):
        return state.labels[index]
    return f"class_{index}"


def humanize_label(label: str) -> str:
    readable = label.replace("___", " - ").replace("__", " - ").replace("_", " ")
    return " ".join(readable.split())


def predict_image(content_type: str | None, content: bytes, settings: Settings, state: InferenceState) -> dict[str, Any]:
    logger.info("Predict image called")
    if not state.model_loaded:
        raise HTTPException(status_code=503, detail=f"Model is not ready: {state.error}")

    if not content_type or not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.max_upload_mb}MB)")

    try:
        input_tensor = preprocess_image(
            content,
            int(state.input_size or settings.image_size),
            state.input_layout,
        )
        if state.backend == "onnx":
            if state.input_name is None:
                raise RuntimeError("ONNX input name was not initialized")
            output_names = [state.output_name] if state.output_name else None
            predictions = state.model.run(output_names, {state.input_name: input_tensor})[0]
        else:
            predictions = state.model.predict(input_tensor, verbose=0)

        logger.info("Raw model output shape: %s, dtype: %s", predictions.shape, predictions.dtype)
        logger.debug("Raw predictions: %s", predictions)
        
        probs = np.asarray(predictions[0], dtype=np.float32)
        class_index = int(np.argmax(probs))
        confidence = float(probs[class_index])
        raw_disease_name = resolve_label(state, class_index)
        disease_name = humanize_label(raw_disease_name)
        
        top_5 = sorted(enumerate(probs), key=lambda x: x[1], reverse=True)[:5]
        logger.info("Probabilities (top 5): %s", top_5)
        logger.info("Class index: %s, Confidence: %.4f, Disease: %s", class_index, confidence, disease_name)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc

    return {
        "diseaseName": disease_name,
        "confidence": confidence,
        "modelMeta": {
            "backend": state.backend,
            "inputSize": state.input_size,
            "inputLayout": state.input_layout,
            "rawInputShape": state.raw_input_shape,
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
        "backend": state.backend,
        "labelsSource": "CLASS_NAMES" if os.getenv("CLASS_NAMES", "").strip() else "LABELS_PATH",
        "inputSize": state.input_size,
        "inputLayout": state.input_layout,
        "rawInputShape": state.raw_input_shape,
        "labelsCount": len(state.labels),
        "error": state.error,
    }
