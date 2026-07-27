# Changelog

## 0.5.0 - 2026-07-27

- Replaced the self-hosted full-stack release with a thin official MCP connector.
- Fixed the upstream service to `https://api.madeforai.net/mcp`.
- Limited the public surface to nine user-side tools.
- Added a second allowlist inside the connector so operator tools remain hidden even if the upstream tool list is misconfigured.
- Removed the database, Chinese operator workspace, production credentials, payment confirmation, shipment, and fulfillment administration from the public package.

## Legacy releases

Version 0.4.0 and earlier contained the complete prototype server under the MIT license. Those historical releases remain available under their original terms, but they are not the official MadeForAI hosted fulfillment service.
