#!/usr/bin/env python3
"""Convert a TensorFlow/Keras model to ONNX for lightweight deployment.

Usage:
    python scripts/convert_to_onnx.py \
      --keras-model ./model/best_plant_model.keras \
      --onnx-model ./model/best_plant_model.onnx \
      --quantize
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert a Keras model to ONNX")
    parser.add_argument("--keras-model", required=True, help="Path to source .keras/.h5 model")
    parser.add_argument("--onnx-model", required=True, help="Path to output .onnx model")
    parser.add_argument("--opset", type=int, default=13, help="ONNX opset version")
    parser.add_argument("--quantize", action="store_true", help="Also export a dynamic INT8 ONNX model")
    return parser.parse_args()


def _resolve_input_signature(model: Any, tf: Any) -> tuple[Any, ...]:
    input_shape = model.input_shape
    if isinstance(input_shape, list):
        input_shape = input_shape[0]

    if not input_shape or len(input_shape) != 4:
        raise ValueError(f"Expected NHWC model input with rank 4, got: {input_shape}")

    _, h, w, c = input_shape
    if not isinstance(h, int) or not isinstance(w, int) or not isinstance(c, int):
        raise ValueError(f"Model input shape must be static except batch dim, got: {input_shape}")

    return (tf.TensorSpec((None, h, w, c), tf.float32, name="input"),)


def main() -> None:
    try:
        import tensorflow as tf
        import tf2onnx
        from onnxruntime.quantization import QuantType, quantize_dynamic
    except Exception as exc:
        raise RuntimeError(
            "Missing conversion dependencies. Use Python 3.12 (project version), then install with: "
            "python -m pip install -r requirements-convert.txt"
        ) from exc

    args = parse_args()
    keras_path = Path(args.keras_model).resolve()
    onnx_path = Path(args.onnx_model).resolve()

    if not keras_path.exists():
        raise FileNotFoundError(f"Keras model not found: {keras_path}")

    onnx_path.parent.mkdir(parents=True, exist_ok=True)

    model = tf.keras.models.load_model(str(keras_path))
    input_signature = _resolve_input_signature(model, tf)

    tf2onnx.convert.from_keras(
        model,
        input_signature=input_signature,
        opset=args.opset,
        output_path=str(onnx_path),
    )

    print(f"Exported ONNX model: {onnx_path}")

    if args.quantize:
        quantized_path = onnx_path.with_name(f"{onnx_path.stem}.int8{onnx_path.suffix}")
        quantize_dynamic(
            model_input=str(onnx_path),
            model_output=str(quantized_path),
            weight_type=QuantType.QInt8,
        )
        print(f"Exported quantized ONNX model: {quantized_path}")


if __name__ == "__main__":
    main()
