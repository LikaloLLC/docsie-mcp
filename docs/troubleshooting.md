# Troubleshooting

## Tools Are Not Visible

Check:

- client is connected to `https://app.docsie.io/mcp`
- OAuth completed successfully
- selected workspace has the expected permissions
- selected permission packs include the tool category
- client refreshed or reconnected after permission changes

## OAuth Redirect Failed

If Dynamic Client Registration fails with `invalid_redirect_uri`, the client redirect host or native-app scheme may not be allowlisted by Docsie.

Capture:

- client name
- redirect URI
- full DCR error
- whether client uses browser, localhost, or native-app callback

## ChatGPT Tool Call Fails

ChatGPT validates MCP tool schemas more strictly than some other clients. Verify production has the latest schema compatibility changes:

- `$schema` on every `inputSchema`
- `additionalProperties: false`
- tool `title`
- `annotations`
- valid JSON Schema 2020-12

## Video-to-Docs Does Not Start

Check:

- URL is public HTTP(S)
- URL points to a video or accessible video page
- Google Drive link is shared correctly
- workspace has enough AI credits
- token has `video_docs` permission pack
- selected workspace is the intended workspace

## Service Token Still Works After Revocation

Expected behavior: future MCP requests should fail after token revocation. If a client still appears connected:

- restart/reconnect the MCP client
- confirm the exact token value being used
- test direct `/mcp` request with that token
- confirm the service connection is revoked in Docsie

## TODO(andrei)

Add exact errors and screenshots from:

- Claude
- ChatGPT
- Cursor
- Windsurf
- VS Code
- Smithery
- Copilot Studio
