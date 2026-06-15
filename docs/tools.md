# Tools

Docsie MCP exposes tools based on the user or service token, selected organization, selected workspace, and granted permission packs.

## Core Tools

| Tool | Title | Permission Pack | Read/Write | Notes |
| --- | --- | --- | --- | --- |
| `video_to_docs_list` | List Video-to-Docs Jobs | `video_docs` | Read | List video/documentation jobs. |
| `video_to_docs_submit` | Start Video-to-Docs | `video_docs` | Write | Start from video URL or Docsie file ID. |
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
| `docsie_agent_start` | Start Docsie Agent Run | `agent_runs` | Write | Start scoped Docsie agent background task. |
| `ai_credits_buy` | Buy AI Credits | `billing` | Write | Return Stripe Checkout URL. |

## Video-to-Docs Submit Example

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
