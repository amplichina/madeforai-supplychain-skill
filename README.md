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
