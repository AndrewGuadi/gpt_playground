from dotenv import load_dotenv
from openai import OpenAI
import os


load_dotenv()  
client = OpenAI()


completion = client.chat.completions.create(
    model="o4-mini",
    messages=[
        {
            "role": "user",
            "content": "Write a one-sentence bedtime story about a unicorn."
        }
    ]
)

print(completion.choices[0].message.content)