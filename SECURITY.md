# Security

Docsie MCP uses OAuth2 Authorization Code + PKCE. Users authenticate with Docsie and grant explicit permission packs before MCP tools are exposed.

Access is scoped by Docsie user, organization, selected default workspace, workspace membership, and permission pack. A connected MCP client does not receive global access to all Docsie data.

Billing and agentic payment tools require the `billing` permission pack. Stripe Checkout sessions require user completion. x402 payments unlock paid workflow access only after facilitator verification and settlement.

Report MCP security concerns to phil@docsie.io.
