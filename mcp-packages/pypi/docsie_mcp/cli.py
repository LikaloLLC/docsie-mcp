"""Local stdio bridge for the hosted Docsie MCP server."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any


DEFAULT_ENDPOINT = "https://app.docsie.io/mcp"
PROTOCOL_VERSION = "2025-06-18"
TOKEN_ENV_NAMES = ("DOCSIE_MCP_TOKEN", "DOCSIE_SERVICE_TOKEN", "DOCSIE_API_TOKEN")


def _config() -> tuple[str, str]:
    endpoint = (os.environ.get("DOCSIE_MCP_ENDPOINT") or DEFAULT_ENDPOINT).strip()
    token = ""
    for name in TOKEN_ENV_NAMES:
        value = (os.environ.get(name) or "").strip()
        if value:
            token = value
            break
    return endpoint, token


def _result(request_id: Any, result: dict[str, Any]) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def _error(request_id: Any, code: int, message: str, data: Any = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"jsonrpc": "2.0", "id": request_id, "error": {"code": code, "message": message}}
    if data is not None:
        payload["error"]["data"] = data
    return payload


def _missing_token_error(request_id: Any) -> dict[str, Any]:
    return _error(
        request_id,
        -32001,
        "Docsie MCP token is not configured. Set DOCSIE_MCP_TOKEN to a Docsie MCP service token.",
        {"env": list(TOKEN_ENV_NAMES)},
    )


def _forward_to_docsie(payload: dict[str, Any]) -> dict[str, Any]:
    endpoint, token = _config()
    if not token:
        return _missing_token_error(payload.get("id"))

    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "MCP-Protocol-Version": PROTOCOL_VERSION,
            "User-Agent": "docsie-mcp local-stdio-bridge/0.1.0",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            response_body = response.read().decode("utf-8")
            return json.loads(response_body) if response_body else _result(payload.get("id"), {})
    except urllib.error.HTTPError as exc:
        response_body = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(response_body) if response_body else {}
        except ValueError:
            return _error(payload.get("id"), -32603, f"Docsie MCP returned non-JSON HTTP {exc.code}", response_body[:1000])
        if isinstance(parsed, dict) and parsed.get("jsonrpc") == "2.0":
            return parsed
        return _error(payload.get("id"), -32603, f"Docsie MCP HTTP {exc.code}", parsed)
    except Exception as exc:  # pragma: no cover - network failures are environment-specific
        return _error(payload.get("id"), -32603, f"Docsie MCP request failed: {exc}")


def _handle_message(message: dict[str, Any]) -> dict[str, Any] | None:
    request_id = message.get("id")
    method = message.get("method")
    if not method:
        return _error(request_id, -32600, "Invalid Request")

    if method.startswith("notifications/"):
        return None

    if method == "initialize":
        params = message.get("params") or {}
        return _result(
            request_id,
            {
                "protocolVersion": params.get("protocolVersion") or PROTOCOL_VERSION,
                "capabilities": {"tools": {"listChanged": True}},
                "serverInfo": {"name": "Docsie MCP Local Bridge", "version": "0.1.0"},
            },
        )

    if method == "ping":
        return _result(request_id, {})

    if method in {
        "tools/list",
        "tools/call",
        "resources/list",
        "resources/templates/list",
        "prompts/list",
        "completion/complete",
        "logging/setLevel",
    }:
        return _forward_to_docsie(message)

    return _error(request_id, -32601, "Method not found")


def _write(message: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(message, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def main() -> int:
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            message = json.loads(line)
            if not isinstance(message, dict):
                _write(_error(None, -32600, "Invalid Request"))
                continue
            response = _handle_message(message)
            if response is not None:
                _write(response)
        except ValueError as exc:
            _write(_error(None, -32700, "Parse error", str(exc)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
