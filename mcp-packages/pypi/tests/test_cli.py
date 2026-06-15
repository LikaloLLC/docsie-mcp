from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def run_bridge(message: dict, env: dict | None = None) -> dict:
    subprocess_env = os.environ.copy()
    if env:
        subprocess_env.update(env)
    completed = subprocess.run(
        [sys.executable, "-m", "docsie_mcp.cli"],
        input=json.dumps(message) + "\n",
        text=True,
        capture_output=True,
        check=True,
        env=subprocess_env,
    )
    return json.loads(completed.stdout)


def test_initialize_responds_locally(monkeypatch):
    response = run_bridge(
        {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18"}}
    )

    assert response["id"] == 1
    assert response["result"]["serverInfo"]["name"] == "Docsie MCP Local Bridge"
    assert response["result"]["capabilities"]["tools"]["listChanged"] is True


def test_missing_token_returns_clear_error(monkeypatch):
    response = run_bridge(
        {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
        {
            "DOCSIE_MCP_TOKEN": "",
            "DOCSIE_SERVICE_TOKEN": "",
            "DOCSIE_API_TOKEN": "",
        },
    )

    assert response["id"] == 2
    assert response["error"]["code"] == -32001
    assert "DOCSIE_MCP_TOKEN" in response["error"]["message"]


def test_forwards_tools_list_to_configured_docsie_endpoint():
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):  # noqa: N802
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length).decode("utf-8")
            payload = json.loads(body)
            requests.append({"headers": self.headers, "payload": payload})

            response = {
                "jsonrpc": "2.0",
                "id": payload["id"],
                "result": {
                    "tools": [
                        {
                            "name": "docsie_search",
                            "description": "Search Docsie",
                            "inputSchema": {"type": "object"},
                        }
                    ]
                },
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))

        def log_message(self, format, *args):  # noqa: A002
            return

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        port = server.server_address[1]
        response = run_bridge(
            {"jsonrpc": "2.0", "id": 3, "method": "tools/list", "params": {}},
            {
                "DOCSIE_MCP_ENDPOINT": f"http://127.0.0.1:{port}/mcp",
                "DOCSIE_MCP_TOKEN": "test-token",
            },
        )

        assert response["id"] == 3
        assert response["result"]["tools"][0]["name"] == "docsie_search"
        assert requests[0]["headers"]["Authorization"] == "Bearer test-token"
        assert requests[0]["headers"]["MCP-Protocol-Version"] == "2025-06-18"
        assert requests[0]["payload"]["method"] == "tools/list"
    finally:
        server.shutdown()
        server.server_close()
