# @docsie/mcp

Local stdio bridge for the hosted Docsie MCP server.

Use this package for MCP clients or directories that require a locally-run stdio server instead of a remote Streamable HTTP endpoint.

## Install Snippet

```json
{
  "mcpServers": {
    "docsie": {
      "command": "npx",
      "args": ["-y", "@docsie/mcp"],
      "env": {
        "DOCSIE_MCP_TOKEN": "mcp_sa_...",
        "DOCSIE_MCP_ENDPOINT": "https://app.docsie.io/mcp"
      }
    }
  }
}
```

`DOCSIE_MCP_ENDPOINT` defaults to `https://app.docsie.io/mcp`.

## Authentication

The first version expects a Docsie MCP service token:

```bash
export DOCSIE_MCP_TOKEN=mcp_sa_...
npx -y @docsie/mcp
```

The token is sent as:

```text
Authorization: Bearer <token>
```

The token still controls the selected Docsie organization, workspace, and permission packs.
