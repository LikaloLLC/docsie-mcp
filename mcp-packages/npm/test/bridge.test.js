import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import { describe, it } from "node:test";

const sampleTool = {
  name: "video_to_docs_submit",
  title: "Start Video-to-Docs",
  description: "Start a Docsie video-to-docs job.",
  inputSchema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      video_url: { type: "string", format: "uri" }
    },
    required: ["video_url"],
    additionalProperties: false
  },
  outputSchema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      content: { type: "array" },
      structuredContent: { type: "object" }
    },
    required: ["content", "structuredContent"],
    additionalProperties: false
  },
  annotations: {
    title: "Start Video-to-Docs",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true
  }
};

function runBridge(messages, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["bin/docsie-mcp.js"], {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"]
    });

    const output = [];
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      output.push(...chunk.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)));
    });
    child.on("error", reject);
    child.on("exit", () => resolve(output));

    for (const message of messages) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    }
    child.stdin.end();
  });
}

function withServer(handler) {
  const server = http.createServer(handler);
  return {
    async listen() {
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      return server.address().port;
    },
    async close() {
      await new Promise((resolve) => server.close(resolve));
    }
  };
}

describe("docsie-mcp local bridge", () => {
  it("responds to initialize locally", async () => {
    const [response] = await runBridge([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } }
    ]);

    assert.equal(response.id, 1);
    assert.equal(response.result.serverInfo.name, "Docsie MCP Local Bridge");
    assert.equal(response.result.capabilities.tools.listChanged, true);
  });

  it("returns a clear token error before proxying tool calls", async () => {
    const [response] = await runBridge([
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }
    ], {
      DOCSIE_MCP_TOKEN: "",
      DOCSIE_SERVICE_TOKEN: "",
      DOCSIE_API_TOKEN: ""
    });

    assert.equal(response.id, 2);
    assert.equal(response.error.code, -32001);
    assert.match(response.error.message, /DOCSIE_MCP_TOKEN/);
  });

  it("forwards tools/list to the configured Docsie endpoint", async () => {
    const server = withServer((request, response) => {
      assert.equal(request.method, "POST");
      assert.equal(request.headers.authorization, "Bearer test-token");
      assert.equal(request.headers["mcp-protocol-version"], "2025-06-18");

      let body = "";
      request.setEncoding("utf8");
      request.on("data", (chunk) => {
        body += chunk;
      });
      request.on("end", () => {
        const payload = JSON.parse(body);
        assert.equal(payload.method, "tools/list");

        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
          jsonrpc: "2.0",
          id: payload.id,
          result: { tools: [sampleTool] }
        }));
      });
    });

    const port = await server.listen();
    try {
      const [response] = await runBridge([
        { jsonrpc: "2.0", id: 3, method: "tools/list", params: {} }
      ], {
        DOCSIE_MCP_ENDPOINT: `http://127.0.0.1:${port}/mcp`,
        DOCSIE_MCP_TOKEN: "test-token"
      });

      assert.equal(response.id, 3);
      assert.deepEqual(response.result.tools[0], sampleTool);
    } finally {
      await server.close();
    }
  });

  it("passes tools/call requests through without rewriting arguments", async () => {
    let forwardedPayload;
    const server = withServer((request, response) => {
      let body = "";
      request.setEncoding("utf8");
      request.on("data", (chunk) => {
        body += chunk;
      });
      request.on("end", () => {
        forwardedPayload = JSON.parse(body);
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
          jsonrpc: "2.0",
          id: forwardedPayload.id,
          result: {
            content: [{ type: "text", text: "Estimate complete." }],
            structuredContent: { credits_required: 10 }
          }
        }));
      });
    });

    const port = await server.listen();
    try {
      const request = {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "video_to_docs_estimate",
          arguments: {
            video_url: "https://example.com/demo.mp4",
            duration_minutes: 5
          }
        }
      };
      const [response] = await runBridge([request], {
        DOCSIE_MCP_ENDPOINT: `http://127.0.0.1:${port}/mcp`,
        DOCSIE_MCP_TOKEN: "test-token"
      });

      assert.equal(response.id, 4);
      assert.equal(response.result.structuredContent.credits_required, 10);
      assert.deepEqual(forwardedPayload, request);
    } finally {
      await server.close();
    }
  });
});
