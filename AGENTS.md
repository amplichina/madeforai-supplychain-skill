# Agent Maintenance Notes

- Keep this repository a thin connector to `https://api.madeforai.net/mcp`.
- Do not add a task database, operator console, supplier records, payment confirmation, or fulfillment administration.
- Do not add custom upstream endpoint configuration to the official package.
- Never expose operator-only tools through the public connector.
- Preserve the human-approval-first workflow.
- Do not add image generation, LLM inference, real payment processing, or automatic ordering.
- Prefer typed code, minimal dependencies, and focused tests.
- Never commit access tokens or production credentials.
