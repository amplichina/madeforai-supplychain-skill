# MadeForAI Hosted Supply Chain Connector

This open-source MCP connector forwards authorized manufacturing task requests from Codex, Claude, Gemini, Cursor, and other MCP clients to the MadeForAI hosted order-intake service.

## Trust boundary

The connector contains only stdio transport, the nine public tool names, and a fixed upstream endpoint: `https://api.madeforai.net/mcp`.

It does **not** contain the order database, Chinese production workspace, production credentials, supplier records, payment-confirmation authority, shipment authority, or fulfillment administration. Forks remain usable under MIT, but they do not gain access to MadeForAI-hosted tasks or private production systems.

## Install a release package

Download `madeforai-supplychain-connector-0.5.1.tgz` from the matching GitHub Release, then install it:

```bash
npm install --global ./madeforai-supplychain-connector-0.5.1.tgz
madeforai-supplychain
```

The command exits with a clear error until `MADEFORAI_ACCESS_TOKEN` is set. Tokens must contain at least 32 characters.

## Build from source

```bash
git clone https://github.com/amplichina/madeforai-supplychain-skill.git
cd madeforai-supplychain-skill
npm ci
npm run build
npm test
```

## MCP client configuration

Request a client access token from MadeForAI. Keep it out of source code, screenshots, issue reports, and public examples.

For a globally installed release package:

```json
{
  "mcpServers": {
    "madeforai": {
      "command": "madeforai-supplychain",
      "env": {
        "MADEFORAI_ACCESS_TOKEN": "replace-with-your-32-character-or-longer-token"
      }
    }
  }
}
```

For a source checkout, use `node` with the absolute path to `dist/src/index.js`.

Clients with native remote MCP support may connect directly:

```json
{
  "url": "https://api.madeforai.net/mcp",
  "headers": {
    "Authorization": "Bearer replace-with-your-client-token"
  }
}
```

## Public MCP tools

- `create_supplychain_task`
- `generate_artwork_brief`
- `generate_quote_request`
- `generate_order_draft`
- `confirm_order_draft`
- `confirm_production_feedback`
- `create_payment_link`
- `quick_start_prototype_pipeline`
- `get_task`

Production feedback, payment confirmation, manufacturing progress, quality checks, shipment, and completion remain unavailable through this public connector.

## Safety boundaries

MadeForAI does not generate images, run LLM inference, process real payments, or automatically place supplier orders in this release. A submitted task enters a manual-review queue; submission does not mean that review has started, and no response time is guaranteed. Prices and lead times remain unconfirmed until manual feedback is recorded.

## License

The connector is MIT licensed. The hosted control plane, production workspace, credentials, databases, and production operations are separate proprietary services.
