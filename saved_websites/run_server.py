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
webbrowser.open(f"http://localhost:{PORT}/saved_websites/sensors/index.html")

# Keep the script running to keep server alive
input("Press Enter to stop server and exit...\n")