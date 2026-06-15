# mcp-remote

Use `mcp-remote` when a local stdio MCP client needs to connect to Docsie's hosted remote MCP endpoint.

## Example

```json
{
  "mcpServers": {
    "docsie": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://app.docsie.io/mcp"
      ]
    }
  }
}
```

## TODO(andrei)

- Verify this works against production with OAuth.
- Add screenshots.
- Add client-specific examples where this is preferred over `@docsie/mcp`.
