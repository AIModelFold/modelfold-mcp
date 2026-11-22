"""ModelFold presets for the OpenAI Python SDK."""

import os
from typing import List, Optional

from openai import OpenAI
from openai.types import Model

__all__ = ["BASE_URL", "ModelFold"]
BASE_URL = "https://modelfold.ai/v1"


class ModelFold(OpenAI):
    """OpenAI-compatible client using a ModelFold API key."""

    def __init__(self, api_key: Optional[str] = None, **kwargs):
        key = (api_key if api_key is not None else os.getenv("MODELFOLD_API_KEY", "")).strip()
        if not key:
            raise ValueError("Set MODELFOLD_API_KEY or pass api_key.")
        kwargs.setdefault("max_retries", 0)
        super().__init__(api_key=key, base_url=BASE_URL, **kwargs)

    def list_models(self) -> List[Model]:
        """Return models using the OpenAI SDK's model list endpoint."""
        return list(self.models.list())
