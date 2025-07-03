from docfinder.gpt_connect.client import GPTClient
from dotenv import load_dotenv

load_dotenv()


gpt = GPTClient()


if __name__ =="__main__":
    prompt = input('What do you want to know?')
    response = gpt.chat_response(prompt)
    print(response)
    