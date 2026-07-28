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
# MadeForAI Supply Chain Connector

The official open-source MCP connector for MadeForAI, the interface between AI agents and human-operated manufacturing execution in China.

## What this repository contains

This package is an intentionally thin connector. It:

- exposes user-side MadeForAI tools to a local MCP client over stdio;
- forwards authorized requests to `https://api.madeforai.net/mcp`;
- routes real tasks to the MadeForAI hosted control plane;
- returns status, operator feedback, quote information, production updates, and delivery results to the user's AI interface.

It does **not** contain a task database, supplier records, the Chinese operator workspace, production credentials, payment confirmation logic, or fulfillment administration.

## Official fulfillment boundary

Only the hosted service at `api.madeforai.net` is the official MadeForAI order intake. Public clients can create tasks, review structured order drafts, accept human quotes, and query status. Production feedback, payment confirmation, manufacturing progress, quality checks, shipment, and completion are restricted to the protected MadeForAI control plane.

Forks may modify this connector under the MIT license, but modified forks are not the official MadeForAI service and do not gain access to MadeForAI orders, credentials, databases, operators, or supplier relationships.

## Installation

```bash
npm install
npm run build
```

Request an access token from MadeForAI, then configure your MCP client:

```json
{
  "mcpServers": {
    "madeforai": {
      "command": "node",
      "args": ["/absolute/path/to/madeforai-supplychain-connector/dist/src/index.js"],
      "env": {
        "MADEFORAI_ACCESS_TOKEN": "your-invited-client-token"
      }
    }
  }
}
```

Clients with native remote MCP support can connect directly:

```json
{
  "url": "https://api.madeforai.net/mcp",
  "headers": {
    "Authorization": "Bearer your-invited-client-token"
  }
}
```

Never publish the access token in source code, screenshots, issue reports, or public configuration examples.

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

Operator-only tools are deliberately unavailable through this connector.

## Safety boundaries

MadeForAI does not generate images, run LLM inference, process real payments, or automatically place supplier orders in this release. Human approval remains required before execution. Prices come from human production feedback.

## License

The connector is MIT licensed. The hosted MadeForAI control plane, operator workspace, production operations, credentials, databases, and supplier records are separate proprietary services.
