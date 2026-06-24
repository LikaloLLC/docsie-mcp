# Service Tokens

Service tokens let an organization run a shared MCP connection with fixed Docsie access. This is useful when an organization wants a shared agent that works for downstream users who do not each have their own Docsie login.

## When To Use

Use service tokens for:

- shared organization agents
- customer-facing agents backed by a controlled Docsie workspace
- local stdio wrappers that cannot perform OAuth
- CI or automation workflows

Use user OAuth for:

- personal Docsie access
- per-user permissions
- user-specific workspace access

## Scope

Each service token is scoped to:

- one organization
- one selected workspace
- selected permission packs
- the Docsie account that created it

## Local Wrapper Config

```json
{
  "mcpServers": {
    "docsie": {
      "command": "npx",
      "args": ["-y", "docsie-mcp"],
      "env": {
        "DOCSIE_MCP_TOKEN": "mcp_sa_...",
        "DOCSIE_MCP_ENDPOINT": "https://app.docsie.io/mcp"
      }
    }
  }
}
```

## TODO(andrei)

Add screenshots for:

- creating a service token
- selecting permission packs
- revoking a token
- using token in Claude/Cursor/Windsurf local wrapper
