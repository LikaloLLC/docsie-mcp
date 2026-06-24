#!/usr/bin/env node

import readline from "node:readline";

const DEFAULT_ENDPOINT = "https://app.docsie.io/mcp";
const PROTOCOL_VERSION = "2025-06-18";
const TOKEN_ENV_NAMES = ["DOCSIE_MCP_TOKEN", "DOCSIE_SERVICE_TOKEN", "DOCSIE_API_TOKEN"];

function getConfig() {
  const endpoint = (process.env.DOCSIE_MCP_ENDPOINT || DEFAULT_ENDPOINT).trim();
  const tokenName = TOKEN_ENV_NAMES.find((name) => process.env[name]);
  const token = tokenName ? process.env[tokenName].trim() : "";
  return { endpoint, token, tokenName };
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function makeResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function makeError(id, code, message, data = undefined) {
  const error = { code, message };
  if (data !== undefined) {
    error.data = data;
  }
  return { jsonrpc: "2.0", id, error };
}

function missingTokenError(id) {
  return makeError(
    id,
    -32001,
    "Docsie MCP token is not configured. Set DOCSIE_MCP_TOKEN to a Docsie MCP service token.",
    { env: TOKEN_ENV_NAMES }
  );
}

async function forwardToDocsie(payload) {
  const { endpoint, token } = getConfig();
  if (!token) {
    return missingTokenError(payload.id ?? null);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "MCP-Protocol-Version": PROTOCOL_VERSION,
      "User-Agent": "docsie-mcp local-stdio-bridge/0.1.0"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    return makeError(
      payload.id ?? null,
      -32603,
      `Docsie MCP returned non-JSON HTTP ${response.status}`,
      { body: text.slice(0, 1000) }
    );
  }

  if (!response.ok && body && body.error) {
    if (body.jsonrpc === "2.0") {
      return body;
    }
    return makeError(payload.id ?? null, -32603, `Docsie MCP HTTP ${response.status}`, body);
  }

  return body;
}

async function handleMessage(message) {
  if (!message || typeof message !== "object") {
    return makeError(null, -32600, "Invalid Request");
  }

  const id = message.id ?? null;
  const method = message.method;

  if (!method) {
    return makeError(id, -32600, "Invalid Request");
  }

  if (method.startsWith("notifications/")) {
    return null;
  }

  if (method === "initialize") {
    return makeResult(id, {
      protocolVersion: message.params?.protocolVersion || PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: true } },
      serverInfo: { name: "Docsie MCP Local Bridge", version: "0.1.0" }
    });
  }

  if (method === "ping") {
    return makeResult(id, {});
  }

  if (
    method === "tools/list" ||
    method === "tools/call" ||
    method === "resources/list" ||
    method === "resources/templates/list" ||
    method === "prompts/list" ||
    method === "completion/complete" ||
    method === "logging/setLevel"
  ) {
    return forwardToDocsie(message);
  }

  return makeError(id, -32601, "Method not found");
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity
});

rl.on("line", async (line) => {
  if (!line.trim()) {
    return;
  }

  try {
    const message = JSON.parse(line);
    const response = await handleMessage(message);
    if (response) {
      writeMessage(response);
    }
  } catch (error) {
    writeMessage(makeError(null, -32700, "Parse error", String(error?.message || error)));
  }
});

rl.on("close", () => {
  // Let in-flight async request handlers finish before Node exits naturally.
});
