#!/usr/bin/env node

import { spawn } from "node:child_process";

const DEFAULT_COMMAND = "npx -y docsie-mcp";
const DEFAULT_ENDPOINT = "https://app.docsie.io/mcp";
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_POLL_MS = 15000;
const TERMINAL_STATUSES = new Set(["done", "failed", "canceled"]);

function requireConfirmedRun() {
  if (process.env.DOCSIE_MCP_E2E_CONFIRM !== "1") {
    throw new Error(
      "Refusing to run a real video-to-docs job. Set DOCSIE_MCP_E2E_CONFIRM=1 to confirm credit-consuming E2E execution."
    );
  }
}

function ensureEnv() {
  const tokenNames = ["DOCSIE_MCP_TOKEN", "DOCSIE_SERVICE_TOKEN", "DOCSIE_API_TOKEN"];
  if (!tokenNames.some((name) => process.env[name])) {
    throw new Error(`Set one of ${tokenNames.join(", ")} before running this E2E smoke test.`);
  }
  if (
    !process.env.DOCSIE_MCP_E2E_VIDEO_URL &&
    !process.env.DOCSIE_MCP_E2E_EXISTING_JOB_ID &&
    !process.env.DOCSIE_MCP_E2E_EXISTING_FINAL_JOB_ID
  ) {
    throw new Error("Set DOCSIE_MCP_E2E_VIDEO_URL to a small public HTTP(S) video URL.");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function boolEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function statusOf(payload) {
  return String(payload?.normalized_status || payload?.status || "").toLowerCase();
}

function structured(response, label) {
  if (response?.error) {
    throw new Error(`${label} failed: ${response.error.message}`);
  }
  const data = response?.result?.structuredContent;
  if (!data || typeof data !== "object") {
    throw new Error(`${label} returned no structuredContent.`);
  }
  return data;
}

function contentText(response) {
  const content = response?.result?.content;
  if (!Array.isArray(content)) {
    return "";
  }
  return content.map((item) => item?.text || "").filter(Boolean).join("\n");
}

function validateFinalResult(data) {
  if (statusOf(data) !== "done") {
    throw new Error(`Final result is not done: ${JSON.stringify(data)}`);
  }

  const resultUrl = data.article_url || data.book_url || data.result_url;
  if (!resultUrl || !/^https?:\/\//.test(resultUrl)) {
    throw new Error(`Final result is missing a Docsie URL: ${JSON.stringify(data)}`);
  }

  if (!data.book_id && !data.article_id && !data.book_url && !data.article_url) {
    throw new Error(`Final result is missing Docsie book/article identifiers: ${JSON.stringify(data)}`);
  }

  const hasContent =
    (typeof data.markdown === "string" && data.markdown.trim().length > 0) ||
    (Array.isArray(data.sections) && data.sections.length > 0) ||
    Boolean(data.article_id || data.article_url);
  if (!hasContent) {
    throw new Error(`Final result has no generated content signal: ${JSON.stringify(data)}`);
  }

  return resultUrl;
}

class McpStdioClient {
  constructor(command) {
    this.command = command;
    this.nextId = 1;
    this.pending = new Map();
    this.stderr = "";
    this.buffer = "";
    this.child = spawn(command, {
      shell: true,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.child.stdout.setEncoding("utf8");
    this.child.stderr.setEncoding("utf8");
    this.child.stdout.on("data", (chunk) => this._onStdout(chunk));
    this.child.stderr.on("data", (chunk) => {
      this.stderr += chunk;
    });
    this.child.on("exit", (code) => {
      for (const { reject, timer } of this.pending.values()) {
        clearTimeout(timer);
        reject(new Error(`MCP command exited with ${code}: ${this.stderr.trim()}`));
      }
      this.pending.clear();
    });
  }

  _onStdout(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      let payload;
      try {
        payload = JSON.parse(line);
      } catch (error) {
        throw new Error(`MCP bridge returned non-JSON line: ${line}`);
      }
      const pending = this.pending.get(payload.id);
      if (!pending) {
        continue;
      }
      clearTimeout(pending.timer);
      this.pending.delete(payload.id);
      pending.resolve(payload);
    }
  }

  request(method, params = {}, timeoutMs = 120000) {
    const id = this.nextId++;
    const payload = { jsonrpc: "2.0", id, method, params };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(`${JSON.stringify(payload)}\n`);
    });
  }

  async close() {
    this.child.stdin.end();
    await sleep(100);
    if (!this.child.killed) {
      this.child.kill("SIGTERM");
    }
  }
}

async function waitForVideoJob(client, jobId, label, timeoutMs, pollMs) {
  const started = Date.now();
  let lastStatus = "";
  while (Date.now() - started < timeoutMs) {
    const response = await client.request("tools/call", {
      name: "video_to_docs_status",
      arguments: { job_id: jobId },
    });
    const data = structured(response, `${label} status`);
    const status = statusOf(data);
    if (status !== lastStatus) {
      console.log(`${label} ${jobId}: ${status || "unknown"}`);
      lastStatus = status;
    }
    if (TERMINAL_STATUSES.has(status)) {
      if (status !== "done") {
        throw new Error(`${label} ${jobId} ended as ${status}: ${JSON.stringify(data)}`);
      }
      return data;
    }
    await sleep(pollMs);
  }
  throw new Error(`${label} ${jobId} did not finish within ${Math.round(timeoutMs / 1000)} seconds.`);
}

async function maybeGenerateDocumentation(client, sourceJobId, sourceResult, timeoutMs, pollMs) {
  try {
    const resultUrl = validateFinalResult(sourceResult);
    return { jobId: sourceJobId, result: sourceResult, resultUrl, generated: false };
  } catch (error) {
    if (!sourceResult.session_id && !sourceResult.markdown) {
      throw error;
    }
  }

  const generateResponse = await client.request("tools/call", {
    name: "video_to_docs_generate",
    arguments: {
      job_id: sourceJobId,
      doc_style: process.env.DOCSIE_MCP_E2E_DOC_STYLE || "guide",
      book_title: process.env.DOCSIE_MCP_E2E_BOOK_TITLE || `MCP E2E Smoke ${new Date().toISOString()}`,
      output_formats: ["md"],
    },
  });
  const generate = structured(generateResponse, "video_to_docs_generate");
  const generateJobId = generate.job_id || generate.generate_job_id;
  if (!generateJobId) {
    throw new Error(`video_to_docs_generate did not return a job_id: ${JSON.stringify(generate)}`);
  }
  console.log(`Generation job started: ${generateJobId}`);
  await waitForVideoJob(client, generateJobId, "generation", timeoutMs, pollMs);
  const resultResponse = await client.request("tools/call", {
    name: "video_to_docs_result",
    arguments: { job_id: generateJobId },
  });
  const result = structured(resultResponse, "generation result");
  const resultUrl = validateFinalResult(result);
  return { jobId: generateJobId, result, resultUrl, generated: true };
}

async function maybeVerifyExport(client, jobId, timeoutMs, pollMs) {
  const formatsRaw = process.env.DOCSIE_MCP_E2E_EXPORT_FORMATS;
  if (!formatsRaw) {
    return null;
  }
  const outputFormats = formatsRaw.split(",").map((item) => item.trim()).filter(Boolean);
  if (!outputFormats.length) {
    return null;
  }
  const exportResponse = await client.request("tools/call", {
    name: "video_to_docs_export_generated",
    arguments: {
      job_id: jobId,
      output_formats: outputFormats,
    },
  });
  const exportStart = structured(exportResponse, "video_to_docs_export_generated");
  const exportJobId = exportStart.export_job_id || exportStart.job_id;
  if (!exportJobId) {
    throw new Error(`Export did not return a job_id: ${JSON.stringify(exportStart)}`);
  }
  console.log(`Export job started: ${exportJobId}`);
  await waitForVideoJob(client, exportJobId, "export", timeoutMs, pollMs);
  const resultResponse = await client.request("tools/call", {
    name: "video_to_docs_export_result",
    arguments: { job_id: exportJobId },
  });
  const result = structured(resultResponse, "export result");
  if (statusOf(result) !== "done") {
    throw new Error(`Export result is not done: ${JSON.stringify(result)}`);
  }
  if (!result.url && !result.file_resolver_url && !result.file_id) {
    throw new Error(`Export result has no downloadable file signal: ${JSON.stringify(result)}`);
  }
  return result;
}

async function main() {
  requireConfirmedRun();
  ensureEnv();

  const command = process.env.DOCSIE_MCP_COMMAND || DEFAULT_COMMAND;
  const endpoint = process.env.DOCSIE_MCP_ENDPOINT || DEFAULT_ENDPOINT;
  const timeoutMs = Number(process.env.DOCSIE_MCP_E2E_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const pollMs = Number(process.env.DOCSIE_MCP_E2E_POLL_MS || DEFAULT_POLL_MS);
  const quality = process.env.DOCSIE_MCP_E2E_QUALITY || "draft";
  const videoUrl = process.env.DOCSIE_MCP_E2E_VIDEO_URL;
  const existingJobId = process.env.DOCSIE_MCP_E2E_EXISTING_JOB_ID;
  const existingFinalJobId = process.env.DOCSIE_MCP_E2E_EXISTING_FINAL_JOB_ID;

  console.log(`Starting Docsie MCP video-to-docs E2E through: ${command}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Quality: ${quality}`);

  const client = new McpStdioClient(command);
  try {
    const init = await client.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "docsie-video-to-docs-e2e" },
    });
    if (init?.error) {
      throw new Error(`initialize failed: ${init.error.message}`);
    }

    const toolsResponse = await client.request("tools/list");
    if (toolsResponse?.error) {
      throw new Error(`tools/list failed: ${toolsResponse.error.message}`);
    }
    const tools = toolsResponse?.result?.tools;
    if (!Array.isArray(tools) || !tools.length) {
      throw new Error("tools/list returned no tools.");
    }
    const toolNames = new Set((tools || []).map((tool) => tool.name));
    for (const required of ["video_to_docs_submit", "video_to_docs_status", "video_to_docs_result", "video_to_docs_generate"]) {
      if (!toolNames.has(required)) {
        throw new Error(`Required MCP tool is not exposed: ${required}`);
      }
    }

    if (existingFinalJobId) {
      const finalResultResponse = await client.request("tools/call", {
        name: "video_to_docs_result",
        arguments: { job_id: existingFinalJobId },
      });
      const finalResult = structured(finalResultResponse, "existing final video_to_docs_result");
      const resultUrl = validateFinalResult(finalResult);
      const exportResult = await maybeVerifyExport(client, existingFinalJobId, timeoutMs, pollMs);
      console.log(JSON.stringify({
        ok: true,
        resumed_existing_final_job: true,
        final_job_id: existingFinalJobId,
        result_url: resultUrl,
        book_id: finalResult.book_id,
        article_id: finalResult.article_id,
        export_file_id: exportResult?.file_id,
        export_url: exportResult?.url || exportResult?.file_resolver_url,
      }, null, 2));
      return;
    }

    let sourceJobId = existingJobId;
    if (sourceJobId) {
      console.log(`Resuming existing video-to-docs job: ${sourceJobId}`);
    } else {
      const estimateResponse = await client.request("tools/call", {
        name: "video_to_docs_estimate",
        arguments: { video_url: videoUrl, quality, duration_minutes: 1 },
      });
      const estimate = structured(estimateResponse, "video_to_docs_estimate");
      console.log(`Estimate: ${JSON.stringify({
        estimated_minimum_cost: estimate.estimated_minimum_cost,
        has_sufficient_credits: estimate.has_sufficient_credits,
        balance: estimate.balance,
      })}`);
      if (estimate.has_sufficient_credits === false) {
        throw new Error(`Insufficient credits before submit: ${JSON.stringify(estimate)}`);
      }

      const submitArgs = {
        video_url: videoUrl,
        quality,
        language: process.env.DOCSIE_MCP_E2E_LANGUAGE || "english",
        doc_style: process.env.DOCSIE_MCP_E2E_DOC_STYLE || "guide",
        book_title: process.env.DOCSIE_MCP_E2E_BOOK_TITLE || `MCP E2E Smoke ${new Date().toISOString()}`,
        auto_generate: boolEnv("DOCSIE_MCP_E2E_AUTO_GENERATE", false),
        dokuta_annotations_enabled: boolEnv("DOCSIE_MCP_E2E_DOKUTA_ANNOTATIONS", false),
      };
      if (process.env.DOCSIE_MCP_E2E_WORKSPACE_ID) {
        submitArgs.workspace_id = process.env.DOCSIE_MCP_E2E_WORKSPACE_ID;
      }
      if (process.env.DOCSIE_MCP_E2E_TARGET_DOCUMENTATION_ID) {
        submitArgs.target_documentation_id = process.env.DOCSIE_MCP_E2E_TARGET_DOCUMENTATION_ID;
      }

      const submit = structured(
        await client.request("tools/call", { name: "video_to_docs_submit", arguments: submitArgs }),
        "video_to_docs_submit"
      );
      sourceJobId = submit.job_id;
      if (!sourceJobId) {
        throw new Error(`Submit did not return a job_id: ${JSON.stringify(submit)}`);
      }
      console.log(`Video-to-docs job started: ${sourceJobId}`);
    }

    await waitForVideoJob(client, sourceJobId, "analysis", timeoutMs, pollMs);
    const sourceResultResponse = await client.request("tools/call", {
      name: "video_to_docs_result",
      arguments: { job_id: sourceJobId },
    });
    const sourceResult = structured(sourceResultResponse, "video_to_docs_result");
    if (contentText(sourceResultResponse)) {
      console.log(contentText(sourceResultResponse).split("\n")[0]);
    }

    const final = await maybeGenerateDocumentation(client, sourceJobId, sourceResult, timeoutMs, pollMs);
    const exportResult = await maybeVerifyExport(client, final.jobId, timeoutMs, pollMs);

    console.log(JSON.stringify({
      ok: true,
      source_job_id: sourceJobId,
      final_job_id: final.jobId,
      generation_was_needed: final.generated,
      result_url: final.resultUrl,
      book_id: final.result.book_id,
      article_id: final.result.article_id,
      export_file_id: exportResult?.file_id,
      export_url: exportResult?.url || exportResult?.file_resolver_url,
    }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
