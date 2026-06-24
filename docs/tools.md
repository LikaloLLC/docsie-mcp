# Tools

Docsie MCP exposes tools based on the user or service token, selected organization, selected workspace, and granted permission packs.

## How To Choose Tools

Use direct job tools when the MCP client can manage a simple submit/poll/result flow:

```text
video_to_docs_submit -> video_to_docs_status -> video_to_docs_result
video_compare_submit -> video_compare_status -> video_compare_result
```

Use the remote Docsie agent when the request should behave like Docsie Chat:

```text
docsie_agent_start -> docsie_agent_status -> docsie_agent_result
```

Choose `docsie_agent_start` for multi-step workflows that involve video analysis plus rewrite, DOCX template filling, video comparison, imports/finalization, publishing, compliance review, or waiting for async operations. The remote agent creates a hidden Docsie chat session and can use internal session-bound Docsie tools while the MCP client only tracks `agent_run_id`.

## Core Tools

| Tool | Title | Permission Pack | Read/Write | Notes |
| --- | --- | --- | --- | --- |
| `video_to_docs_list` | List Video-to-Docs Jobs | `video_docs` | Read | List video/documentation jobs. |
| `video_to_docs_submit` | Start Video-to-Docs | `video_docs` | Write | Direct API-style job. Start from video URL or Docsie file ID, then poll by `job_id`. |
| `video_to_docs_status` | Check Video-to-Docs Status | `video_docs` | Read | Poll analysis/generation/export status. |
| `video_to_docs_result` | Get Video-to-Docs Result | `video_docs` | Read | Fetch finished result metadata. |
| `video_to_docs_generate` | Generate Documentation from Video | `video_docs` | Write | Generate/rerun markdown documentation. |
| `video_to_docs_export` | Export Video Documentation | `video_docs` | Write | Export completed markdown to DOCX/PDF/PPTX. |
| `video_to_docs_export_generated` | Export Generated Video Documentation | `video_docs` | Write | Export generated-documentation job results. |
| `video_to_docs_cancel` | Cancel Video-to-Docs Job | `video_docs` | Write | Cancel running job. |
| `video_to_docs_estimate` | Estimate Video-to-Docs Credits | `video_docs` | Read | Estimate credits before submit. |
| `video_compare_submit` | Start Video Compare or Combine | `video_docs` | Write | Compare 2-4 videos or combine 2-10 videos. |
| `voice_options` | List Voice Options | `video_docs` | Read | Discover narration providers. |
| `voice_speech` | Generate Voice Narration | `video_docs` | Write | Generate narration audio. |
| `list_workspaces` | List Workspaces | multiple | Read | List accessible workspaces for connection. |
| `docsie_search` | Search Docsie Content | `workspace_read` | Read | Search workspace articles/content. |
| `docsie_get_article` | Get Docsie Article | `workspace_read` | Read | Fetch article markdown. |
| `docsie_agent_start` | Start Docsie Agent Run | `agent_runs` | Write | Start a Docsie Chat-style scoped background agent run for complex workflows. |
| `ai_credits_buy` | Buy AI Credits | `billing` | Write | Return Stripe Checkout URL. |

## Video-to-Docs Submit Example

Use this for a direct job-ID flow. For "do the whole workflow" prompts, prefer `docsie_agent_start`.

```json
{
  "name": "video_to_docs_submit",
  "arguments": {
    "video_url": "https://example.com/demo.mp4",
    "quality": "standard",
    "doc_style": "guide",
    "auto_generate": true
  }
}
```

## Remote Docsie Agent Example

```json
{
  "name": "docsie_agent_start",
  "arguments": {
    "task": "Analyze this video, generate step-by-step documentation, rewrite it as a release note, import the final content into Docsie, and return the final article link. Video: https://example.com/demo.mp4",
    "agent_hint": "video",
    "max_iterations": 30
  }
}
```

Then poll:

```json
{
  "name": "docsie_agent_status",
  "arguments": {
    "agent_run_id": "mcparun_..."
  }
}
```

Fetch the final output:

```json
{
  "name": "docsie_agent_result",
  "arguments": {
    "agent_run_id": "mcparun_..."
  }
}
```

Accepted video URL aliases:

- `video_url`
- `url`
- `source_url`
- `video_file_url`
- `video_link`
- `source_video_url`

Accepted file ID aliases:

- `file_id`
- `docsie_file_id`
- `source_file_id`
- `video_file_id`

## TODO(andrei)

Add real client screenshots showing:

- tool discovery
- `docsie_search`
- `video_to_docs_submit`
- `video_to_docs_status`
- `video_to_docs_result`
- result link back to Docsie
