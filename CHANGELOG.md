# Changelog

## 0.5.2 - 2026-07-30

- Added the MCP Registry ownership marker through `package.json#mcpName` and the matching README marker.
- Added a package-name command alias so `npx madeforai-supplychain-connector` resolves directly.
- Added `server.json` metadata for the official MCP Registry.
- Replaced manual `.tgz` installation as the primary path with a one-line npx command.
- Reduced the npm `files` whitelist to compiled runtime files; npm still includes required package metadata, README, and license files.

## 0.5.1 - 2026-07-28

- Removed compiled connector tests from the release package by limiting npm files to `dist/src`.
- Replaced unverified live-capacity wording with accurate hosted-intake and manual-review queue language.
- Pinned the MCP SDK to the compatible `~1.29.0` range.
- Added package repository metadata and complete `.tgz`, source-build, token, and MCP-client installation instructions.
- Split missing-token and short-token diagnostics.

## 0.5.0 - 2026-07-27

- Replaced the self-hosted full-stack release with a thin official MCP connector.
- Fixed the upstream service to `https://api.madeforai.net/mcp`.
- Limited the public surface to nine user-side tools.
- Added a second allowlist inside the connector so operator tools remain hidden even if the upstream tool list is misconfigured.
- Removed the database, Chinese operator workspace, production credentials, payment confirmation, shipment, and fulfillment administration from the public package.

## Legacy releases

Version 0.4.0 and earlier contained the complete prototype server under the MIT license. Those historical releases remain available under their original terms, but they are not the official MadeForAI hosted fulfillment service.
