# Cursor

## Remote URL

```text
https://app.docsie.io/mcp
```

## Local Wrapper

Use this if Cursor requires a local stdio MCP process:

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

## TODO(andrei)

- Add exact Cursor config path.
- Add OAuth vs service-token recommendation.
- Add screenshots.
- Add tested tool list.
