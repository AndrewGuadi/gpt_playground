from dotenv import load_dotenv
import os
from pydantic import BaseModel
from docfinder.gpt_connect.client import GPTClient
from dir_tools.file_utils import FileUtils


load_dotenv()  

gpt = GPTClient(model='gpt-4.1')

def create_pages(page):
    fields = {
        "html_filepath":str,
        'html': str,
        'js_filepath':str,
        'js': str,
        'css_filepath':str,
        'css': str
    }

    ##create pydantic model
    code_model = gpt.create_pydantic_model('code-output', fields)
    prompt = f"I want to create the current page(must be detailed and all spots filled in with placeholder data): {page}, using tailwind(<script src='https://cdn.tailwindcss.com'></script>), put all javascript in one file, put all css in one file.:\n\n\nThe Webpage Should be fully functional. It should be very long and it should use the most complex cutting edge css and styles like neumorphism."
    output = gpt.structured_response(prompt, code_model)
    print(gpt.messages)
    BASE_DIR = FileUtils.get_basedirectory()
    if output.html:
        filepath = os.path.join(BASE_DIR, 'saved_websites', 'test-plumbing', output.html_filepath)
        FileUtils.write_file(filepath, output.html)
        print(f"File written: {filepath}")

    if output.js:
        filepath = os.path.join(BASE_DIR, 'saved_websites', 'test-plumbing', output.js_filepath)
        FileUtils.write_file(filepath, output.js)
        print(f"File written: {filepath}")

    if output.css:
        filepath = os.path.join(BASE_DIR, 'saved_websites', 'test-plumbing', output.css_filepath)
        FileUtils.write_file(filepath, output.css)
        print(f"File written: {filepath}")
    

def list_webpages(project_dir):

    sitemap_fields = {
        'title':str,
        'pages': list[str]
    }
    sitemap_model = gpt.create_pydantic_model('sitemap_model', sitemap_fields)

    #read all documentation
    BASE_DIR = FileUtils.get_basedirectory()
    documentation_dir = os.path.join(BASE_DIR, 'resources', project_dir, 'project-documents')

    documentation = FileUtils.read_all_documents(documentation_dir)
    prompt = f'List all the webpages used in this documentation: {documentation}'

    pages_data = gpt.structured_response(prompt, sitemap_model)
    
    return pages_data

    

if __name__ == "__main__":
    pages = list_webpages('test-plumbing')
    for i, page in enumerate(pages.pages):
        print(page)
        create_pages(page)
        if i >= 0:
            break

    print('Wrote pages')

