from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


PYPI_PACKAGE_ROOT = Path(__file__).resolve().parents[1]


SAMPLE_TOOL = {
    "name": "video_to_docs_submit",
    "title": "Start Video-to-Docs",
    "description": "Start a Docsie video-to-docs job.",
    "inputSchema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {"video_url": {"type": "string", "format": "uri"}},
        "required": ["video_url"],
        "additionalProperties": False,
    },
    "outputSchema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
            "content": {"type": "array"},
            "structuredContent": {"type": "object"},
        },
        "required": ["content", "structuredContent"],
        "additionalProperties": False,
    },
    "annotations": {
        "title": "Start Video-to-Docs",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": False,
        "openWorldHint": True,
    },
}


def run_bridge(message: dict, env: dict | None = None) -> dict:
    subprocess_env = os.environ.copy()
    current_python_path = subprocess_env.get("PYTHONPATH")
    python_path_parts = [str(PYPI_PACKAGE_ROOT)]
    if current_python_path:
        python_path_parts.append(current_python_path)
    subprocess_env["PYTHONPATH"] = os.pathsep.join(python_path_parts)
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
                "result": {"tools": [SAMPLE_TOOL]},
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
        assert response["result"]["tools"][0] == SAMPLE_TOOL
        assert requests[0]["headers"]["Authorization"] == "Bearer test-token"
        assert requests[0]["headers"]["MCP-Protocol-Version"] == "2025-06-18"
        assert requests[0]["payload"]["method"] == "tools/list"
    finally:
        server.shutdown()
        server.server_close()


def test_passes_tools_call_requests_through_without_rewriting_arguments():
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):  # noqa: N802
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length).decode("utf-8")
            payload = json.loads(body)
            requests.append(payload)

            response = {
                "jsonrpc": "2.0",
                "id": payload["id"],
                "result": {
                    "content": [{"type": "text", "text": "Estimate complete."}],
                    "structuredContent": {"credits_required": 10},
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
        request = {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "video_to_docs_estimate",
                "arguments": {
                    "video_url": "https://example.com/demo.mp4",
                    "duration_minutes": 5,
                },
            },
        }
        response = run_bridge(
            request,
            {
                "DOCSIE_MCP_ENDPOINT": f"http://127.0.0.1:{port}/mcp",
                "DOCSIE_MCP_TOKEN": "test-token",
            },
        )

        assert response["id"] == 4
        assert response["result"]["structuredContent"]["credits_required"] == 10
        assert requests[0] == request
    finally:
        server.shutdown()
        server.server_close()
