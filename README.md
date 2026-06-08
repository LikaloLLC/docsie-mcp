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
