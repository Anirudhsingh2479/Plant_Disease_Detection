from dataclasses import dataclass, field
from typing import Any


@dataclass
class InferenceState:
    model: Any = None
    labels: list[str] = field(default_factory=list)
    input_size: int = 256
    model_loaded: bool = False
    error: str | None = None
    chatbot_ready: bool = False
    chatbot_error: str | None = None


STATE = InferenceState()
