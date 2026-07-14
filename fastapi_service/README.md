# FastAPI Inference Service

This service exposes a prediction API used by the Node server.

## Endpoints

- `GET /health` -> readiness and model status
- `POST /predict` -> multipart image upload (`file` field)
- `POST /chat` -> chatbot response using RAG + Gemini
- `GET /chat/stream` -> SSE chat response stream

## Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Python target for this service is `3.12`.

3. Set required environment variables:

```bash
export MODEL_PATH="/absolute/path/to/your/best_plant_model.onnx"
export MODEL_BACKEND="auto"
export GOOGLE_API_KEY="your_google_api_key"
# Optional:
# export ONNX_PROVIDERS="CPUExecutionProvider"
# export CLASS_NAMES="Healthy,LeafRust,Septoria"
# export LABELS_PATH="/absolute/path/to/labels.json"
# export IMAGE_SIZE="256"
# export MAX_UPLOAD_MB="5"
# export CHATBOT_KNOWLEDGE_PATH="/absolute/path/to/plant_disease.txt"
# export CHATBOT_CHROMA_PATH="/absolute/path/to/chroma_db"
# export CHATBOT_EMBEDDING_MODEL="sentence-transformers/all-mpnet-base-v2"
# export CHATBOT_WARMUP="true"
```

4. Start the API:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Convert Keras model to ONNX

If your trained model is currently `.keras`/`.h5`, convert it before deployment:

```bash
python -m pip install -r requirements-convert.txt

python scripts/convert_to_onnx.py \
	--keras-model ./model/best_plant_model.keras \
	--onnx-model ./model/best_plant_model.onnx \
	--quantize
```

This creates:
- `best_plant_model.onnx` (standard ONNX)
- `best_plant_model.int8.onnx` (smaller quantized model)

Point `MODEL_PATH` to whichever one you want to serve.

If `pip install -r requirements-convert.txt` tries to build `onnx` from source (very long output with `cmake`), you are likely on Python 3.13. Use Python 3.12 for conversion.

## Notes

- `MODEL_PATH` can point to `.onnx`, `.keras`, or `.h5`.
- `MODEL_BACKEND=auto` selects ONNX for `.onnx` files and TensorFlow for `.keras`/`.h5`.
- ONNX Runtime is recommended for deployment portability and lower memory overhead.
- `requirements.txt` is optimized for ONNX runtime deployment (no TensorFlow runtime dependency).
- `requirements-convert.txt` is only needed when exporting TensorFlow/Keras models to ONNX.
- `/chat` and `/chat/stream` are configured to run without TensorFlow imports.
- Chat retrieval now uses Chroma with local persistence at `CHATBOT_CHROMA_PATH` (or legacy `CHATBOT_FAISS_PATH` fallback if set).
- `CLASS_NAMES` can be used for label mapping in prediction output.
- If no labels are provided, output names are returned as `class_<index>`.
- `POST /chat` request body: `{"user_message":"...","detected_disease":null,"session_id":"user-1","language":"English"}`
- `GET /chat/stream` query params: `user_message`, optional `detected_disease`, optional `session_id`, optional `language`.
