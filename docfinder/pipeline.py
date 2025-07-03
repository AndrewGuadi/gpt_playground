from dotenv import load_dotenv
import os
from pydantic import BaseModel
from .gpt_connect.client import GPTClient
from dir_tools.file_utils import FileUtils


load_dotenv()  

gpt = GPTClient(model='gpt-4.1')

fields = {
    'html': str,
    'js': str,
    'css': str
}

##create pydantic model
new_model = gpt.create_pydantic_model('code-output', fields)
BASE_DIR = os.path.dirname(__file__)  # directory of pipeline.py
filepath = os.path.join(BASE_DIR, 'documents', 'project_outline.txt')
document = FileUtils.read_file(filepath)
prompt = f"I want to create this website, using tailwind, put all javascript in one file, put all css in one file.: {document}.\n\n\nThe Website Should be fully functional. It should be very long and it should use the most cutting edge css and styles like neumorphism."
output = gpt.structured_response(prompt + "the page should only import local files, styles.css and script.js  ", new_model)
print(output.html)
print(output.js)
print(output.css)


with open("index.html", "w", encoding="utf-8") as f:
    f.write(output.html)

with open("script.js", "w", encoding="utf-8") as f:
    f.write(output.js)

with open("styles.css", "w", encoding="utf-8") as f:
    f.write(output.css)

print("Files written: index.html, script.js, style.css")

# Simple HTTP server to serve current directory on port 8000
import http.server
import socketserver
import webbrowser
import threading

PORT = 8000

def start_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()

# Start server in a thread so script doesn't block
threading.Thread(target=start_server, daemon=True).start()

# Open the page in the default browser (Codespaces will open in a new tab)
webbrowser.open(f"http://localhost:{PORT}/index.html")

# Keep the script running to keep server alive
input("Press Enter to stop server and exit...\n")