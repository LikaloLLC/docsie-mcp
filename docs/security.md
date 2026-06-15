# Security

Docsie MCP access is scoped by:

- OAuth user or organization-managed service credential
- selected Docsie organization
- selected Docsie workspace
- workspace membership and organization access rules
- explicit permission packs selected during authorization

## Authentication

Docsie MCP supports:

- Docsie OAuth with Authorization Code + PKCE
- Dynamic Client Registration for approved redirect URI classes
- Docsie MCP service tokens for shared organization agents

Production OAuth metadata:

```text
https://app.docsie.io/.well-known/oauth-authorization-server
https://app.docsie.io/.well-known/oauth-protected-resource
```

OAuth endpoints:

```text
https://app.docsie.io/mcp/oauth/register/
https://app.docsie.io/mcp/oauth/authorize/
https://app.docsie.io/mcp/oauth/token/
https://app.docsie.io/mcp/oauth/revoke/
```

## Permission Packs

| Pack | Purpose |
| --- | --- |
| `video_docs` | Video-to-docs, video comparison, generated documentation, exports, templates, policy checks, voice tools. |
| `workspace_read` | Search/read workspace content. |
| `workspace_write` | Create/update/import/version/translate Docsie content. |
| `imports` | File import, website extraction, web research, deep research. |
| `publishing` | Deployments, domains, tenant settings, visibility, in-app help publishing. |
| `billing` | Quote credits, create Stripe Checkout links, x402 payment requests. |
| `agent_runs` | Start/monitor/fetch/cancel remote Docsie agent runs. |
| `full_agent` | All MCP-compatible Docsie chat tools in the selected workspace scope. |

## Revocation

Revoking a Docsie MCP connection should prevent future tool calls. Existing client-side cached connections may need to reconnect before the UI reflects revocation.

## TODO(andrei)

Add any security review answers needed by directories:

- data retention answer
- customer data training answer
- rate limit answer
- SOC2/security portal link
- privacy policy link
- terms link
