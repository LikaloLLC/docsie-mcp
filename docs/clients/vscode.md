# VS Code

## Remote URL

```text
https://app.docsie.io/mcp
```

## Local Wrapper

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

- Add VS Code MCP config location.
- Add GitHub Copilot Chat behavior notes.
- Add screenshots.
