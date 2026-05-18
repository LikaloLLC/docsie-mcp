# Docsie MCP

Docsie MCP is Docsie's remote Model Context Protocol server for documentation workflows, scoped knowledge retrieval, AI credit workflows, and video-to-docs automation.

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
- Quote and purchase Docsie AI credits through approved billing flows

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
- `billing`: AI credit quotes, Stripe Checkout links, and x402 payment requests
- `agent_runs`: start, monitor, cancel, and fetch remote Docsie background agent runs

Use the smallest permission pack set needed for your workflow.

## Agentic Payments

Credit-consuming MCP workflows use the organization's Docsie AI credit balance.

When more credits are required, Docsie MCP can return:

- A Stripe Checkout fallback through `ai_credits_checkout`
- An x402 payment request through `ai_credits_x402_payment_request`
- Structured paywall data that explains required credits, available credits, and retry steps

Agentic payment tools require the `billing` permission pack. x402 credit grants occur only after payment verification and settlement.

## Example Prompts

```text
List my Docsie workspaces.
Search Docsie knowledge for onboarding API documentation.
Fetch the article content for the selected Docsie article.
Estimate the Docsie AI credits needed for a video-to-docs job.
Create a Stripe Checkout link for 10,000 Docsie AI credits.
Build an x402 payment request for 10,000 Docsie AI credits.
```

## Links

- Docsie: https://www.docsie.io/
- App: https://app.docsie.io/
- Documentation: https://docsie.com/
- Privacy and terms: https://terms.docsie.io/

## Support

For support, contact Docsie through the support channels on https://www.docsie.io/.
