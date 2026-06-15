import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import { describe, it } from "node:test";

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

describe("@docsie/mcp local bridge", () => {
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
    const server = http.createServer((request, response) => {
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
          result: { tools: [{ name: "docsie_search", description: "Search Docsie", inputSchema: { type: "object" } }] }
        }));
      });
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const { port } = server.address();
      const [response] = await runBridge([
        { jsonrpc: "2.0", id: 3, method: "tools/list", params: {} }
      ], {
        DOCSIE_MCP_ENDPOINT: `http://127.0.0.1:${port}/mcp`,
        DOCSIE_MCP_TOKEN: "test-token"
      });

      assert.equal(response.id, 3);
      assert.equal(response.result.tools[0].name, "docsie_search");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
