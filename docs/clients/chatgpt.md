# ChatGPT / OpenAI

Docsie MCP can be connected through OpenAI-compatible MCP surfaces when the host supports remote MCP servers and OAuth.

Production endpoint:

```text
https://app.docsie.io/mcp
```

## OpenAI App Submission

OpenAI distribution uses the ChatGPT Apps SDK review flow, not only a generic MCP directory listing.

Checklist:

- hosted MCP endpoint live
- OAuth/DCR working
- tool titles present
- tool annotations present
- JSON Schema 2020-12 compatible `inputSchema`
- privacy/security review answers ready
- demo video ready

## Video-to-Docs Notes

ChatGPT may emit alternate argument names for video URLs. Docsie accepts:

- `video_url`
- `url`
- `source_url`
- `video_file_url`
- `video_link`
- `source_video_url`

## TODO(andrei)

- Add exact ChatGPT setup flow.
- Add screenshots.
- Add OpenAI submission status.
- Add failing/passing test prompts.
