#!/usr/bin/env node

import { spawn } from "node:child_process";

const DEFAULT_COMMAND = "npx -y docsie-mcp";
const DEFAULT_EXPECTED_TOOLS = [
  "video_to_docs_list",
  "video_to_docs_submit",
  "video_to_docs_status",
  "video_to_docs_result",
  "video_to_docs_generate",
  "video_to_docs_export",
  "video_to_docs_estimate",
  "video_compare_submit",
  "video_compare_status",
  "video_compare_result",
  "list_workspaces",
  "search_articles"
];

function expectedTools() {
  const raw = process.env.DOCSIE_MCP_EXPECTED_TOOLS;
  if (!raw) {
    return DEFAULT_EXPECTED_TOOLS;
  }
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function ensureTokenConfigured() {
  const tokenNames = ["DOCSIE_MCP_TOKEN", "DOCSIE_SERVICE_TOKEN", "DOCSIE_API_TOKEN"];
  if (!tokenNames.some((name) => process.env[name])) {
    throw new Error(`Set one of ${tokenNames.join(", ")} before running this smoke test.`);
  }
}

function validateToolShape(tool) {
  if (!tool || typeof tool !== "object") {
    throw new Error("Tool entry is not an object.");
  }
  for (const key of ["name", "title", "description"]) {
    if (typeof tool[key] !== "string" || !tool[key].trim()) {
      throw new Error(`${tool.name || "<unknown>"} is missing a non-empty ${key}.`);
    }
  }
  if (!tool.inputSchema || typeof tool.inputSchema !== "object") {
    throw new Error(`${tool.name} is missing inputSchema.`);
  }
  if (tool.inputSchema.type !== "object") {
    throw new Error(`${tool.name} inputSchema.type must be object.`);
  }
  if (!tool.inputSchema.$schema) {
    throw new Error(`${tool.name} inputSchema is missing $schema.`);
  }
  if (tool.inputSchema.additionalProperties !== false) {
    throw new Error(`${tool.name} inputSchema must set additionalProperties=false.`);
  }
  if (!tool.annotations || typeof tool.annotations !== "object") {
    throw new Error(`${tool.name} is missing annotations.`);
  }
  if (tool.annotations.title !== tool.title) {
    throw new Error(`${tool.name} annotations.title must match title.`);
  }
  for (const key of ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"]) {
    if (typeof tool.annotations[key] !== "boolean") {
      throw new Error(`${tool.name} annotations.${key} must be boolean.`);
    }
  }
  if (tool.outputSchema !== undefined) {
    if (!tool.outputSchema || typeof tool.outputSchema !== "object") {
      throw new Error(`${tool.name} outputSchema must be an object when present.`);
    }
    if (!tool.outputSchema.$schema) {
      throw new Error(`${tool.name} outputSchema is missing $schema.`);
    }
    if (tool.outputSchema.additionalProperties !== false) {
      throw new Error(`${tool.name} outputSchema must set additionalProperties=false.`);
    }
  }
}

function runBridge(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"]
    });

    const stdout = [];
    const stderr = [];
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Timed out waiting for MCP bridge command: ${command}`));
    }, Number(process.env.DOCSIE_MCP_SMOKE_TIMEOUT_MS || 60000));

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Command exited with ${code}: ${stderr.join("").trim()}`));
        return;
      }
      resolve(stdout.join(""));
    });

    const messages = [
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "docsie-mcp-smoke" } }
      },
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }
    ];
    if (process.env.DOCSIE_MCP_VERIFY_CALLS === "1") {
      messages.push(
        { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "list_workspaces", arguments: {} } },
        {
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: {
            name: "video_to_docs_estimate",
            arguments: {
              video_url: "https://example.com/docsie-mcp-smoke.mp4",
              duration_minutes: 5,
              quality: "standard"
            }
          }
        }
      );
    }

    for (const message of messages) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    }
    child.stdin.end();
  });
}

function parseJsonLines(output) {
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => JSON.parse(line));
}

async function main() {
  ensureTokenConfigured();
  const command = process.env.DOCSIE_MCP_COMMAND || DEFAULT_COMMAND;
  const responses = parseJsonLines(await runBridge(command));
  const initialize = responses.find((response) => response.id === 1);
  const toolsList = responses.find((response) => response.id === 2);
  const workspaceCall = responses.find((response) => response.id === 3);
  const estimateCall = responses.find((response) => response.id === 4);

  if (!initialize?.result?.serverInfo?.name) {
    throw new Error("Missing initialize response.");
  }
  if (toolsList?.error) {
    throw new Error(`tools/list failed: ${toolsList.error.message}`);
  }

  const tools = toolsList?.result?.tools;
  if (!Array.isArray(tools) || tools.length === 0) {
    throw new Error("tools/list returned no tools.");
  }

  for (const tool of tools) {
    validateToolShape(tool);
  }

  const names = new Set(tools.map((tool) => tool.name));
  const missing = expectedTools().filter((name) => !names.has(name));
  if (missing.length) {
    throw new Error(`Missing expected tools: ${missing.join(", ")}`);
  }

  if (process.env.DOCSIE_MCP_VERIFY_CALLS === "1") {
    if (workspaceCall?.error) {
      throw new Error(`list_workspaces failed: ${workspaceCall.error.message}`);
    }
    if (estimateCall?.error) {
      throw new Error(`video_to_docs_estimate failed: ${estimateCall.error.message}`);
    }
    const workspaces = workspaceCall?.result?.structuredContent?.workspaces;
    if (!Array.isArray(workspaces) || workspaces.length === 0) {
      throw new Error("list_workspaces returned no structured workspaces.");
    }
    const expectedWorkspaceId = process.env.DOCSIE_MCP_EXPECTED_WORKSPACE_ID;
    if (expectedWorkspaceId && !workspaces.some((workspace) => workspace.id === expectedWorkspaceId)) {
      throw new Error(`list_workspaces did not include expected workspace ${expectedWorkspaceId}.`);
    }
    const estimate = estimateCall?.result?.structuredContent;
    if (!estimate || typeof estimate !== "object") {
      throw new Error("video_to_docs_estimate returned no structured estimate.");
    }
    const estimateText = JSON.stringify(estimate).toLowerCase();
    if (!estimateText.includes("credit")) {
      throw new Error("video_to_docs_estimate structured content did not include credit data.");
    }
  }

  console.log(`Verified ${tools.length} Docsie MCP tools through: ${command}`);
  console.log(`Endpoint: ${process.env.DOCSIE_MCP_ENDPOINT || "https://app.docsie.io/mcp"}`);
  console.log(`Expected tools present: ${expectedTools().join(", ")}`);
  if (process.env.DOCSIE_MCP_VERIFY_CALLS === "1") {
    console.log("Safe tool calls passed: list_workspaces, video_to_docs_estimate");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
