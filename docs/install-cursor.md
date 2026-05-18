# Install Docsie MCP In Cursor

Add a remote MCP server:

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

After connecting, Cursor should send you through Docsie OAuth. Choose the organization, default workspace, and permission packs needed for your workflow.
