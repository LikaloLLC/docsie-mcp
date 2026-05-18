# Install Docsie MCP In VS Code

Add Docsie MCP as a remote HTTP MCP server:

```json
{
  "servers": {
    "docsie": {
      "type": "http",
      "url": "https://app.docsie.io/mcp"
    }
  }
}
```

After connecting, complete Docsie OAuth and grant only the permission packs needed for your workspace.
