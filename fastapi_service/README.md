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
pip install -r requirements.txt
```

Python target for this service is `3.11` (or `3.12`).

3. Set required environment variables:

```bash
export MODEL_PATH="/absolute/path/to/your/best_plant_model.keras"
export GOOGLE_API_KEY="your_google_api_key"
# Optional:
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

## Notes

- `MODEL_PATH` must point to a local `.keras` or `.h5` file exported from Colab/Drive.
- TensorFlow-backed `/predict` requires Python `3.11` or `3.12`.
- `/chat` and `/chat/stream` are configured to run without TensorFlow imports.
- Chat retrieval now uses Chroma with local persistence at `CHATBOT_CHROMA_PATH` (or legacy `CHATBOT_FAISS_PATH` fallback if set).
- `CLASS_NAMES` can be used for label mapping in prediction output.
- If no labels are provided, output names are returned as `class_<index>`.
- `POST /chat` request body: `{"user_message":"...","detected_disease":null,"session_id":"user-1","language":"English"}`
- `GET /chat/stream` query params: `user_message`, optional `detected_disease`, optional `session_id`, optional `language`.
