# Docsie MCP

Docsie MCP connects AI assistants to Docsie's AI documentation platform for knowledge base search, help center and product documentation retrieval, video-to-docs automation, native multi-video comparison, Word template fill, policy/compliance checks, presentation creation, content imports, publishing workflows, scoped Docsie agent runs, and CLI-friendly AI credit top-ups.

## Remote Server

Use the hosted MCP endpoint:

```text
https://app.docsie.io/mcp
```

Transport:

```text
Streamable HTTP
```

Authentication:

```text
OAuth2 Authorization Code + PKCE
```

## What It Does

Docsie MCP lets MCP-compatible AI clients connect to Docsie so users can:

- Search approved knowledge bases, help centers, product docs, SOPs, release notes, and support articles
- Retrieve article content and workspace structure from Docsie
- Turn product demos, training videos, screen recordings, and walkthroughs into step-by-step documentation
- Fill customer Word templates from video analysis while preserving the original DOCX layout
- Check videos, audio, text, and generated documentation against policy rules such as PII, HIPAA, brand, training QA, or custom policies
- Create presentation-ready output and live presenter sessions from generated video documentation
- Compare or combine multiple videos through native MCP jobs, then fetch the comparison matrix or combined draft
- Generate, rewrite, translate, and export documentation as Markdown, DOCX, PDF, or PPTX
- Import files, websites, and extracted web content into Docsie documentation workflows
- Publish knowledge bases, in-app help, custom domains, forms, and file-request workflows when granted
- Delegate complex documentation and voice discovery tasks to scoped Docsie AI agents
- Request approved payment options for extended Docsie automation workflows

Users authenticate with Docsie, choose an organization and workspace context, and grant explicit permission packs before tools are exposed.

## Install

Use this server configuration in MCP clients that support remote HTTP servers:

```json
{
  "mcpServers": {
    "docsie": {
      "type": "http",
      "url": "https://app.docsie.io/mcp"
    }
  }
}
```

Exact syntax varies by client. The stable server URL is:

```text
https://app.docsie.io/mcp
```

## Open Plugins / Cursor Store

This repo includes Open Plugins discovery files at the repo root:

- `.plugin/plugin.json`
- `.cursor-plugin/plugin.json`
- `.mcp.json`
- `mcp.json`

The Open Plugins MCP component uses `mcp-remote` to bridge local stdio plugin hosts to Docsie's hosted OAuth MCP endpoint:

```json
{
  "mcpServers": {
    "docsie": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://app.docsie.io/mcp"]
    }
  }
}
```

Client-specific setup drafts:

- [Claude](docs/clients/claude.md)
- [ChatGPT / OpenAI](docs/clients/chatgpt.md)
- [Cursor](docs/clients/cursor.md)
- [Windsurf](docs/clients/windsurf.md)
- [VS Code](docs/clients/vscode.md)
- [GitHub Copilot](docs/clients/github-copilot.md)
- [Smithery](docs/clients/smithery.md)
- [mcp-remote](docs/clients/mcp-remote.md)

Local-only MCP clients can also use:

- npm stdio wrapper: `npx -y docsie-mcp`
- PyPI / uvx stdio wrapper: `uvx docsie-mcp`

Wrapper source is in [`mcp-packages/`](mcp-packages/). Example configs are in [`examples/`](examples/).

## Verification

Wrapper unit tests:

```bash
npm test --prefix mcp-packages/npm
python -m pytest mcp-packages/pypi/tests
```

Live smoke test against the hosted server:

```bash
DOCSIE_MCP_ENDPOINT=https://staging.docsie.io/mcp \
DOCSIE_MCP_TOKEN=... \
node scripts/verify-live-tools.mjs
```

To test a different local bridge command:

```bash
DOCSIE_MCP_COMMAND="uvx docsie-mcp" \
DOCSIE_MCP_TOKEN=... \
node scripts/verify-live-tools.mjs
```

The live smoke verifies `initialize`, `tools/list`, required Docsie tools, JSON Schema shape, tool titles, and MCP tool annotations.

To also verify safe live tool calls:

```bash
DOCSIE_MCP_ENDPOINT=https://staging.docsie.io/mcp \
DOCSIE_MCP_TOKEN=... \
DOCSIE_MCP_VERIFY_CALLS=1 \
DOCSIE_MCP_EXPECTED_WORKSPACE_ID=workspace_... \
node scripts/verify-live-tools.mjs
```

The call check verifies scoped workspace discovery through `list_workspaces` and non-mutating video credit estimation through `video_to_docs_estimate`.

Real video-to-docs E2E smoke, for staging only:

```bash
DOCSIE_MCP_ENDPOINT=https://staging.docsie.io/mcp \
DOCSIE_MCP_TOKEN=... \
DOCSIE_MCP_E2E_CONFIRM=1 \
DOCSIE_MCP_E2E_VIDEO_URL=https://example.com/small-video.mp4 \
DOCSIE_MCP_E2E_WORKSPACE_ID=workspace_... \
node scripts/verify-video-to-docs-e2e.mjs
```

This creates a real video-to-docs job, polls analysis to completion, runs generation, verifies generated Docsie document links/content, and consumes Docsie AI credits. The script sets `auto_generate=false` by default so the E2E controls the generation step explicitly. Optional export verification is available with `DOCSIE_MCP_E2E_EXPORT_FORMATS=docx`.

To resume or verify a staging run without submitting a new video:

```bash
DOCSIE_MCP_ENDPOINT=https://staging.docsie.io/mcp \
DOCSIE_MCP_TOKEN=... \
DOCSIE_MCP_E2E_CONFIRM=1 \
DOCSIE_MCP_E2E_EXISTING_FINAL_JOB_ID=job_key_... \
node scripts/verify-video-to-docs-e2e.mjs
```

## OAuth Discovery

Docsie publishes MCP OAuth metadata at:

```text
https://app.docsie.io/.well-known/oauth-authorization-server
https://app.docsie.io/.well-known/oauth-authorization-server/mcp
https://app.docsie.io/.well-known/oauth-protected-resource
https://app.docsie.io/.well-known/oauth-protected-resource/mcp
```

OAuth endpoints:

```text
https://app.docsie.io/mcp/oauth/register/
https://app.docsie.io/mcp/oauth/authorize/
https://app.docsie.io/mcp/oauth/token/
https://app.docsie.io/mcp/oauth/revoke/
```

## Permission Packs

Docsie MCP access is scoped by:

- Docsie user identity
- Selected organization
- Selected workspace
- Workspace membership
- Explicit permission packs

Common permission packs include:

- `workspace_read`: read and search Docsie knowledge
- `workspace_write`: create and update documentation content, save comparisons, and manage persistent workspace Word fill templates
- `video_docs`: video-to-docs workflows, native video compare/combine jobs, Word template fill, policy checks, advanced annotations, and comparison support
- `video_presentation`: presentation-oriented video analysis, PPTX export workflows, and live presenter sessions
- `imports`: file import, website extraction, research workflows, and web-backed comparisons
- `publishing`: deployments, visibility, file requests, and related publishing tools
- `billing`: approved paid workflow options through CLI-friendly Stripe Checkout links and x402 payment requests
- `agent_runs`: start, monitor, cancel, and fetch remote Docsie background agent runs, with voice discovery tools when enabled for the workspace

Use the smallest permission pack set needed for your workflow.

Organization-managed service credentials are also available for shared agents that should run with a fixed Docsie account instead of requiring every downstream user to log in. Service credentials are scoped to one organization, one selected workspace, and explicit permission packs.

More details:

- [Tools](docs/tools.md)
- [Privacy and Permissions](docs/privacy-and-permissions.md)
- [Security](docs/security.md)
- [Service Tokens](docs/service-tokens.md)
- [Troubleshooting](docs/troubleshooting.md)

## Paid Workflow Controls

Some Docsie automation workflows may require additional processing capacity.

When more capacity is required, Docsie MCP can return:

- A hosted Stripe Checkout fallback
- An x402 payment request for compatible agent clients
- Structured next steps that explain the requested workflow, required authorization, and retry path

Agentic payment tools require the `billing` permission pack. Paid workflow access is granted only after payment verification and settlement.

## Example Prompts

```text
List my Docsie workspaces.
Search Docsie knowledge for onboarding API documentation.
Fetch the article content for the selected Docsie article.
Turn this product walkthrough video into Docsie documentation.
Fill this SOP Word template from the training video.
Check this onboarding video against our PII policy.
Create a presentation from this product demo video.
Analyze these videos and compare the generated procedures.
Buy 100000 Docsie AI credits and give me the payment link.
Find the customer-facing setup steps for this feature.
Create a draft article from the approved workspace knowledge.
```

## Links

- Docsie: https://www.docsie.io/
- App: https://app.docsie.io/
- Documentation: https://docsie.com/
- Privacy and terms: https://terms.docsie.io/

## Support

For MCP directory and integration support, contact phil@docsie.io.
