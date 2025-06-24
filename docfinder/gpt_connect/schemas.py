# gpt_connect/schemas.py
from pydantic import BaseModel

class CalendarEvent(BaseModel):
    name: str
    date: str
    participants: list[str]

# gpt_connect/client.py
import os
from typing import Optional, Type
from openai import OpenAI
from .utils import retry