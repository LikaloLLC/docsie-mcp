# Docsie MCP Local Packages

This directory contains local stdio wrapper packages for MCP clients and directories that do not support hosted Streamable HTTP MCP servers.

The production Docsie MCP server remains:

```text
https://app.docsie.io/mcp
```

These packages are thin bridges. They read MCP JSON-RPC messages from stdio, forward supported calls to the hosted Docsie MCP endpoint, and return the hosted response back over stdio.

## Packages

| Package | Directory | Command | Status |
| --- | --- | --- | --- |
| `docsie-mcp` | `mcp-packages/npm` | `npx -y docsie-mcp` | Source ready; npm publish pending. |
| `docsie-mcp` | `mcp-packages/pypi` | `uvx docsie-mcp` | Source ready; PyPI publish pending. |

## Authentication

Both wrappers currently expect a Docsie MCP service token:

```bash
export DOCSIE_MCP_TOKEN=mcp_sa_...
```

Optional endpoint override:

```bash
export DOCSIE_MCP_ENDPOINT=https://app.docsie.io/mcp
```

The service token still controls organization, workspace, and permission-pack scope. The wrappers do not bypass Docsie authorization.

## npm

```bash
cd mcp-packages/npm
npm test
npm pack --dry-run
```

Example MCP config:

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

## PyPI

```bash
cd mcp-packages/pypi
python3 -m pytest tests/test_cli.py
python3 -m pip install --dry-run .
```

Example MCP config:

```json
{
  "mcpServers": {
    "docsie": {
      "command": "uvx",
      "args": ["docsie-mcp"],
      "env": {
        "DOCSIE_MCP_TOKEN": "mcp_sa_...",
        "DOCSIE_MCP_ENDPOINT": "https://app.docsie.io/mcp"
      }
    }
  }
}
```
