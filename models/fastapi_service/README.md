# FastAPI Inference Service

This service exposes a prediction API used by the Node server.

## Endpoints

- `GET /health` -> readiness and model status
- `POST /predict` -> multipart image upload (`file` field)

## Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set required environment variables:

```bash
export MODEL_PATH="/absolute/path/to/your/best_plant_model.keras"
# Optional:
# export CLASS_NAMES="Healthy,LeafRust,Septoria"
# export LABELS_PATH="/absolute/path/to/labels.json"
# export IMAGE_SIZE="256"
# export MAX_UPLOAD_MB="5"
```

4. Start the API:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Notes

- `MODEL_PATH` must point to a local `.keras` or `.h5` file exported from Colab/Drive.
- `CLASS_NAMES` can be used for label mapping in prediction output.
- If no labels are provided, output names are returned as `class_<index>`.
