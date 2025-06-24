# gpt_connect/client.py
import os
from typing import Optional, Type
from openai import OpenAI
from .utils import retry

class GPTClient:
    """
    Low-level wrapper around the OpenAI Python SDK.
    Expects OPENAI_API_KEY to be set in the environment.
    Allows a manual override only if the environment is unset.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.client = OpenAI() if api_key is None else OpenAI(api_key=api_key)

    def structured_response():