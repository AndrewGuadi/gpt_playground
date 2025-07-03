from .think import needed_information
from dir_tools.file_utils import FileUtils
from .page_builder import generate_html_form
import os


if __name__=="__main__":
    # This file's directory (e.g., .../gpt_connect/)
    CURRENT_DIR = os.path.dirname(__file__)

    # One level up (the parent directory)
    BASE_DIR = os.path.dirname(CURRENT_DIR)

    # Join with your file path from BASE_DIR
    filepath = os.path.join(BASE_DIR, 'docfinder','documents', 'information_outline.txt')
    information_outline = FileUtils.read_file(filepath)
    type_of_website = input('What is your business?')
    goal = f"[Goal]: To build comprehensive Documentation for this clients website:{type_of_website}.\n\nWhat information do you need from me to write these files:\n\n{information_outline}."
    information = needed_information(goal)

    for f in information.forms:
        print(f.formTitle)
        print(f.neededInformation)
        print(f.userForm)

    print(information.complete_customer_questionaire)


    # Generate and save HTML form
    html = generate_html_form(information.forms)
    html_filepath = os.path.join(BASE_DIR, 'saved_websites', 'test_form', 'index.html')
    os.makedirs(os.path.dirname(html_filepath), exist_ok=True)
    FileUtils.write_file(html_filepath, html)