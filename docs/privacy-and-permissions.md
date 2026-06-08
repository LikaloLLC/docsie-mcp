# Privacy And Permissions

Docsie MCP does not grant blanket account access.

Access is scoped by:

- The Docsie user or service credential that authorizes the connection
- The selected Docsie organization
- The selected workspace
- Workspace membership and organization access rules
- Explicit permission packs selected during OAuth

Permission packs separate read, write, import, publishing, billing, and agent-run capabilities.

Organization-managed service credentials can be used for shared agents. They are still bound to one Docsie organization, one selected workspace, and explicit permission packs.

Billing tools are optional and require the `billing` permission pack. Stripe Checkout links require user completion. x402 payment requests are intended for x402-capable agent clients and unlock paid workflow access only after payment settlement.

Privacy policy and terms:

```text
https://terms.docsie.io/
```
