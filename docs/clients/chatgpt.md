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

## Tool Selection Guidance

For simple deterministic jobs, ChatGPT should use the direct tools:

```text
video_to_docs_submit
video_to_docs_status
video_to_docs_result
```

For workflows that should behave like Docsie Chat, ChatGPT should use:

```text
docsie_agent_start
docsie_agent_status
docsie_agent_result
```

Use `docsie_agent_start` when the user asks for a complete documentation workflow, for example:

- analyze a video, generate docs, rewrite the output, and return the final Docsie link
- fill a Word/DOCX template from a video
- compare or combine videos and produce a final draft
- run policy/compliance checks before creating docs
- import, finalize, publish, or otherwise continue after generation
- wait for long-running Docsie operations

`docsie_agent_start` creates a hidden Docsie chat session. The Docsie-side agent can use internal session-bound tools such as video analysis, documentation generation, active-operation monitoring, waits, imports, and rewrites. ChatGPT only needs to keep the returned `agent_run_id` and poll status/result.

Example prompt to test:

```text
Use the Docsie remote agent to analyze this video, generate step-by-step documentation, rewrite it as a release note, import it into Docsie, and return the final article link: https://example.com/demo.mp4
```

Expected high-level MCP call sequence:

```text
docsie_agent_start -> docsie_agent_status -> docsie_agent_result
```

## TODO(andrei)

- Add exact ChatGPT setup flow.
- Add screenshots.
- Add OpenAI submission status.
- Add failing/passing test prompts.
