from docfinder.gpt_connect.client import GPTClient
from dotenv import load_dotenv
import os 



def create_plan(goal):
    #load in the .env variables
    load_dotenv()

    system_role = 'You are a senior enterprise software architect'
    gpt = GPTClient(messages=system_role)

    step_fields ={
        'explanation': str,
        'output': str
    }

    #create the pydantic model
    step = gpt.create_pydantic_model("step", step_fields)

    final_answer_fields = {
        'steps': list[step],
        'final_answer': str
    } 

    final_answer = gpt.create_pydantic_model('final_answer', final_answer_fields)
    #query the model for the plan //response is 
    thoughts = gpt.structured_response(goal, final_answer)
    return thoughts
    
