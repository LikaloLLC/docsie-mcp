# Directory Listing Copy

## Short Description

Remote MCP server for Docsie knowledge search, article retrieval, AI credit workflows, and video-to-docs automation.

## Long Description

Docsie MCP lets AI clients connect to Docsie through a standards-compliant remote MCP endpoint. Users authenticate with Docsie OAuth, choose an organization and workspace context, and grant permission packs for read-only knowledge retrieval, article lookup, video-to-docs workflows, agent runs, publishing tools, and billing actions. The server is designed for scoped documentation automation rather than broad account access.

## Categories

Documentation, Productivity, RAG Systems, AI & Machine Learning, Developer Tools, Video, Finance

## Tags

docsie, documentation, knowledge-base, docs, rag, video-to-docs, oauth, streamable-http, ai-credits, x402, stripe

## Permission Level

High

## Security Notes

Docsie MCP uses OAuth2 Authorization Code + PKCE. Access is scoped by Docsie user, organization, selected default workspace, and explicit permission packs. Read, write, import, publishing, agent-run, and billing capabilities are separately granted. Agentic payment tools require the billing permission pack. x402 payments grant credits only after facilitator verification and settlement; Docsie stores only the public receiving address, not wallet private keys.
