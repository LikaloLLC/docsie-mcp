# Docsie MCP

Docsie MCP is Docsie's remote Model Context Protocol server for documentation workflows, scoped knowledge retrieval, and video-to-docs automation.

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

- List accessible Docsie workspaces
- Search Docsie knowledge
- Fetch Docsie article content
- Run scoped Docsie AI workflows
- Submit and monitor video-to-docs jobs
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
https://app.docsie.io/.well-known/oauth-protected-resource
```

## Permission Packs

Docsie MCP access is scoped by:

- Docsie user identity
- Selected organization
- Selected default workspace
- Workspace membership
- Explicit permission packs

Common permission packs include:

- `workspace_read`: read and search Docsie knowledge
- `workspace_write`: create and update documentation content
- `video_docs`: video-to-docs workflows
- `imports`: file import, website extraction, and research workflows
- `publishing`: deployments, visibility, file requests, and related publishing tools
- `billing`: approved paid workflow options through Stripe Checkout and x402 payment requests
- `agent_runs`: start, monitor, cancel, and fetch remote Docsie background agent runs

Use the smallest permission pack set needed for your workflow.

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
