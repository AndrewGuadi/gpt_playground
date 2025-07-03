from dotenv import load_dotenv
from openai import OpenAI
import os
from pydantic import BaseModel
from .gpt_connect.client import GPTClient


load_dotenv()  

gpt = GPTClient(model='gpt-4.1')

fields = {
    'html': str,
    'js': str,
    'css': str
}

##create pydantic model
new_model = gpt.create_pydantic_model('code-output', fields)
output = gpt.structured_response(input("What do you want us to create?"), new_model)
print(output.html)
print(output.js)
print(output.css)
