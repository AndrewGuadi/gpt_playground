# gpt_connect/client.py
import os
from typing import Optional, Type
from openai import OpenAI
from .utils import retry
from typing import Any, Type, Dict
from pydantic import BaseModel, create_model


class GPTClient:
    """
    Low-level wrapper around the OpenAI Python SDK.
    Expects OPENAI_API_KEY to be set in the environment.
    Allows a manual override only if the environment is unset.
    """
    def __init__(self, api_key: Optional[str] = None, model: str = 'o4-mini'):
        self.client = OpenAI() if api_key is None else OpenAI(api_key=api_key)
        self.model = model
        self.messages = [{"role": "system", "content": "You are the worlds most in-depth web developer, knowing every bit of detailed css, html and javascript"}]


    def add_message(self, prompt):
        try:
            new_message = {
                "role":"user",
                "content":prompt
            }
            self.messages.append(new_message)
            return True
        except Exception:
            return False

    def create_pydantic_model(self, 
        model_name: str,
        fields: Dict[str, Type[Any]]
    ) -> Type[BaseModel]:
        """
        Create a Pydantic model dynamically.

        Args:
            model_name: Name of the model class to create.
            fields: Dictionary where keys are field names and values are Python types.

        Returns:
            A new Pydantic model class.
        """
        # Use Pydantic's create_model to generate a model dynamically
        model = create_model(model_name, **{k: (v, ...) for k, v in fields.items()})
        return model

    def structured_response(self, prompt, pydantic_model):
        self.add_message(prompt)
        response = self.client.responses.parse(
        model=self.model,
        input=self.messages,
        text_format=pydantic_model,
    )

        structured_output = response.output_parsed
        return structured_output

