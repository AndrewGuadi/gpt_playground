from docfinder.gpt_connect.client import GPTClient
from dotenv import load_dotenv
import os 



def create_website_plan(goal):
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
    


def needed_information(goal):
    #load in the .env variables
    load_dotenv()

    system_role = 'You are a senior web developer for small and enterprise businesses. You Build comprehensive web project outlines. '
    gpt = GPTClient(messages=system_role)

     ##create outline for user form
    user_form_fields = {
        'question': str,
        'field_type': str
    }

    user_form = gpt.create_pydantic_model('user_form', user_form_fields)

    form_fields ={
        'formTitle': str,
        'neededInformation': str,
        'userForm': list[user_form]
    }

    #create the pydantic model
    form = gpt.create_pydantic_model("form", form_fields)

    needed_information_fields = {
        'forms': list[form],
        'complete_customer_questionaire': str
    } 

    needed_information = gpt.create_pydantic_model('needed_information',needed_information_fields )
    #query the model for the plan //response is 
    thoughts = gpt.structured_response(goal, needed_information)
    return thoughts
    
