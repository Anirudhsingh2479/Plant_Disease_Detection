from dataclasses import dataclass, field
from typing import Any


@dataclass
class InferenceState:
    model: Any = None
    backend: str = "unknown"
    input_name: str | None = None
    output_name: str | None = None
    input_layout: str = "nhwc"
    raw_input_shape: list[Any] = field(default_factory=list)
    labels: list[str] = field(default_factory=list)
    input_size: int = 256
    model_loaded: bool = False
    error: str | None = None
    chatbot_ready: bool = False
    chatbot_error: str | None = None


STATE = InferenceState()
