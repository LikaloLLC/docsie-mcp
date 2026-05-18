# Directory Listing Copy

## Short Description

Remote MCP server for Docsie video-to-docs automation and workspace knowledge search.

## Long Description

Docsie MCP lets AI clients connect to Docsie through a standards-compliant remote MCP endpoint. Users authenticate with Docsie OAuth, choose an organization and workspace context, and grant permission packs for read-only knowledge retrieval, article lookup, video-to-docs workflows, agent runs, publishing tools, and optional paid workflow authorization. The server helps teams turn videos into documentation, answer questions from approved Docsie knowledge, and retrieve article content without granting broad account access.

## Categories

Documentation, Productivity, Knowledge Management, Developer Tools, Video

## Tags

docsie, documentation, knowledge-base, docs, rag, video-to-docs, oauth, streamable-http, customer-support, knowledge-search

## Contact Email

phil@docsie.io

## Permission Level

High

## Security Notes

Docsie MCP uses OAuth2 Authorization Code + PKCE. Access is scoped by Docsie user, organization, selected default workspace, and explicit permission packs. Read, write, import, publishing, agent-run, and billing capabilities are separately granted. Agentic payment tools require the billing permission pack. Paid workflow access is unlocked only after facilitator verification and settlement; Docsie stores only the public receiving address, not wallet private keys.
