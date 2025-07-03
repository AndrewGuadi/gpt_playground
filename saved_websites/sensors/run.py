import os
import http.server
import socketserver
import webbrowser
import threading

# 1) Where the package lives (this file)
BASE_DIR = os.path.dirname(__file__)

# 2) The folder you actually want to serve
SERVE_DIR = os.path.join(BASE_DIR)

# 3) Change working dir so SimpleHTTPRequestHandler serves that folder
os.chdir(SERVE_DIR)

# 4) Pick a port, bump it if already in use
PORT = 8000
def find_free_port(start=8000, stop=8100):
    import socket
    for p in range(start, stop):
        with socket.socket() as s:
            try:
                s.bind(("", p))
                return p
            except OSError:
                continue
    raise RuntimeError("No free ports in range")

PORT = find_free_port(8000, 8100)

def start_server():
    handler = http.server.SimpleHTTPRequestHandler  # now serves SERVE_DIR
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()

threading.Thread(target=start_server, daemon=True).start()

# 5) Open the index.html in your sensors folder
webbrowser.open(f"http://localhost:{PORT}/index.html")

input("Press Enter to stop server and exit...\n")