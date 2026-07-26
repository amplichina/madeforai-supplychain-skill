# MadeForAI Supply Chain Skill

[中文说明](./README.zh-CN.md)

MadeForAI is an interface layer between AI agents and China-based reality supply chain execution. Version 0.3.4 turns an AI agent's small-batch manufacturing request into a structured Reality Supply Chain Task that a human Reality Operator can execute.

**Give AI agents hands in the real world, with humans holding every irreversible gate.**

In the first stage, a human Reality Operator may review a task, contact suppliers or wholesale market operators, confirm processes, request quotes, check samples, upload photos or videos, and return execution results to the AI agent.

## Why This Exists

AI agents can describe what they want, but real manufacturing still depends on human confirmation: materials, MOQ, process feasibility, quality, samples, logistics, and supplier trust. MadeForAI provides a narrow, auditable bridge from AI intent to human-operated real-world supply chain execution.

MadeForAI does not generate images, does not run LLM inference, does not process real payments, and does not automatically place real-world orders. It only creates and tracks supply chain execution tasks for human Reality Operators. The included mock payment flow validates approval gates without moving money.

## Features

- MCP stdio server for local AI clients such as Claude Desktop, Codex, and Cursor.
- Streamable HTTP MCP endpoint at `POST /mcp` for future remote use.
- Express health check at `GET /health`.
- Operator console at `GET /operator` for human Reality Operators.
- Prisma + PostgreSQL persistence.
- Local manufacturing rule assessment, without external LLM calls.
- Artwork preparation guidance for user-owned AI tools or designers, without generating images.
- Human-approval-first workflow for supplier quotes and sample results.
- Zod validation for all tool inputs.
- Structured bilingual guidance that tells AI clients when to act, ask, or pause.
- Non-blocking manufacturing sanity checks that turn suspicious inputs into clarification questions.
- Phase-1 manufacturing knowledge for nine corporate identity and high-frequency custom-goods categories.
- A zero-config in-memory demo launcher for evaluation.

## Tools

- `create_supplychain_task`: create a Reality Supply Chain Task.
- `generate_artwork_brief`: guide a user's own AI agent or designer to prepare production-ready artwork before task submission. User-facing output defaults to English.
- `generate_quote_request`: create quote request text. Chinese is intended for the production side; English is intended for the user's AI interface.
- `generate_order_draft`: create a structured order draft for user confirmation, plus a Chinese production request preview. Global AI clients should provide `production_title_zh` and `production_description_zh` for the production side.
- `confirm_order_draft`: record user approval or rejection and create a production request after approval.
- `submit_production_feedback`: let the production side return feasibility, quote, lead time, and risks.
- `confirm_production_feedback`: record the user's acceptance or rejection of the exact operator quote and risks.
- `create_payment_link`: create a mock payment link from the accepted operator quote snapshot. The caller cannot provide or alter the amount.
- `confirm_mock_payment`: simulate payment confirmation for local workflow testing.
- `update_production_status`: record paid-order production progress.
- `submit_shipment_info`: record shipment carrier, tracking, and shipping notes.
- `complete_task`: mark a fulfilled task as completed with delivery notes.
- `update_task_status`: let a human Reality Operator update task status.
- `upload_sample_result`: upload sample media URLs, quotes, production time, and feedback.
- `quick_start_prototype_pipeline`: safely create a task and order draft in one call, always stopping before user confirmation.
- `get_task`: return complete task details, quote request, sample result, and history.

## Installation

For a 60-second local evaluation with no database:

```bash
npm install
npm run demo
```

The launcher prints temporary operator credentials, both workspaces, the HTTP MCP endpoint, and a ready-to-paste local MCP configuration.

For PostgreSQL-backed development:

```bash
npm install
cp .env.example .env
npm run prisma:generate
```

Create the PostgreSQL database referenced by `DATABASE_URL`, then run:

```bash
npx prisma migrate dev --name init
```

## Local Development

Run the stdio MCP server:

```bash
npm run start:stdio
```

Run the HTTP server:

```bash
npm run start:http
```

On Windows, this repository also includes helper scripts for local persistent PostgreSQL:

```bash
npm run postgres:start
npm run postgres:ensure-db
npm run prisma:migrate
npm run start:http:postgres
```

Stop the local PostgreSQL server:

```bash
npm run postgres:stop
```

Run a full local persistent verification:

```bash
npm run verify:persistent
```

This starts PostgreSQL if needed, builds the project, runs tests, runs lint, performs the full MCP workflow against PostgreSQL, restarts the HTTP server, and leaves the operator console available at `http://localhost:3000/operator`.

Health check:

```bash
curl http://localhost:3000/health
```

Operator console:

```text
http://localhost:3000/operator
```

The operator console is a Chinese, task-oriented workspace for human Reality Operators. It groups work into requirement review, quote and lead time, samples, production and quality control, logistics, and history. The console highlights the next required action instead of displaying every form at once. It is protected by an environment-configured username and password. Missing credentials lock the console instead of exposing task data.

User workflow:

```text
http://localhost:3000/user
```

The English user workspace demonstrates the approval-first journey seen through an AI client: production brief, order draft confirmation, human Reality Operator feedback, mock payment confirmation, production, and verified delivery. Each step calls the real local workflow tools and pauses at the user approval gates. The walkthrough uses a scripted operator response and mock payment only; it does not place an order or process money.

Non-technical acceptance page:

```text
http://localhost:3000/acceptance
```

This page requires the same operator login as `/operator`. After login, it runs the complete AI-side and production-side workflow with one button and reports pass/fail in Chinese.

For non-technical local acceptance testing, see `docs/LOCAL_VALIDATION.zh-CN.md`.

Build and test:

```bash
npm run build
npm test
```

The current release includes 16 MCP tools, a 16-step approval-first workflow, nine phase-1 manufacturing categories, and 48 focused automated tests, including route-level end-to-end coverage. Payment links are bound to an accepted quote version, amounts cannot exist without an explicit currency, evidence-bearing states require dedicated business tools, quality check is required before shipment, and shipment is required before completion.

For a no-database local MCP smoke test, set `MCP_DEV_MEMORY_STORE=true`, start the HTTP server, then run:

```bash
npm run smoke:http
```

## Environment Variables

| Name                      | Required            | Description                                                                         |
| ------------------------- | ------------------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`            | Yes                 | PostgreSQL connection string used by Prisma.                                        |
| `PORT`                    | No                  | HTTP port. Defaults to `3000`.                                                      |
| `MCP_TRANSPORT`           | No                  | `stdio` or `http`. Defaults to `stdio`.                                             |
| `MCP_DEV_MEMORY_STORE`    | No                  | Set to `true` only for local MCP testing without PostgreSQL. Data is not persisted. |
| `MCP_HTTP_AUTH_REQUIRED`  | No                  | Require a bearer API key for `/mcp`. Production mode always requires one.           |
| `MCP_HTTP_API_KEY`        | Yes in production   | Remote MCP bearer key. Use at least 32 random characters.                           |
| `ENABLE_DEMO_ROUTES`      | No                  | Enables `/demo`, `/user`, and `/acceptance`. Defaults off in production.            |
| `OPERATOR_USERNAME`       | No                  | Operator console username. Defaults to `operator`.                                  |
| `OPERATOR_PASSWORD`       | Yes for `/operator` | Operator console password. Never commit the real value.                             |
| `OPERATOR_SESSION_SECRET` | Yes for `/operator` | Random secret used to sign operator sessions. Use at least 32 random characters.    |
| `OPERATOR_COOKIE_SECURE`  | No                  | Set to `true` when the public operator console is served over HTTPS.                |
| `TRUST_PROXY`             | No                  | Set to `true` only when running behind a trusted reverse proxy.                     |
| `CORS_ORIGIN`             | No                  | Comma-separated browser origin allowlist. Empty disables browser cross-origin use.  |

For persistent local development on this machine, use:

```env
DATABASE_URL="postgresql://madeforai@127.0.0.1:5432/madeforai"
MCP_DEV_MEMORY_STORE=false
MCP_HTTP_AUTH_REQUIRED=false
ENABLE_DEMO_ROUTES=true
OPERATOR_USERNAME=operator
OPERATOR_PASSWORD=replace-with-a-strong-password
OPERATOR_SESSION_SECRET=replace-with-at-least-32-random-characters
OPERATOR_COOKIE_SECURE=false
CORS_ORIGIN=
```

## Running With Docker

```bash
OPERATOR_PASSWORD="replace-with-a-strong-password" \
OPERATOR_SESSION_SECRET="replace-with-at-least-32-random-characters" \
docker compose up --build
```

The app listens on port `3000`, and PostgreSQL listens on port `5432`.

Before production use, run Prisma migrations against the target database, serve the operator console over HTTPS, and set `OPERATOR_COOKIE_SECURE=true`.

For the production-oriented single-server Compose configuration and HTTPS requirements, see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## MCP Client Configuration Example

Example local stdio configuration:

```json
{
  "mcpServers": {
    "madeforai-supplychain-skill": {
      "command": "node",
      "args": ["/absolute/path/to/madeforai-supplychain-skill/dist/src/index.js", "--stdio"],
      "env": {
        "DATABASE_URL": "postgresql://madeforai:madeforai@localhost:5432/madeforai"
      }
    }
  }
}
```

Example remote Streamable HTTP configuration:

```json
{
  "mcpServers": {
    "madeforai-supplychain-skill": {
      "url": "https://your-domain.example/mcp",
      "headers": {
        "Authorization": "Bearer replace-with-your-MCP_HTTP_API_KEY"
      }
    }
  }
}
```

Remote client configuration formats differ, but the `/mcp` request must send the API key as an `Authorization: Bearer ...` header.

## Tool Examples

### Language Model

MadeForAI separates user-facing and production-facing language:

- User-facing AI application output defaults to English and can request Chinese when needed.
- Production-side supplier and Reality Operator materials should be Chinese.
- `generate_order_draft` returns English user confirmation text by default and always includes a Chinese production request preview.
- `generate_quote_request` defaults to Chinese because it is usually sent to the production side; pass `"language": "en"` when the AI application needs an English version for the user.

Generate an artwork preparation brief:

```json
{
  "product_category": "acrylic",
  "product_name": "Acrylic character stand",
  "manufacturing_goal": "Prepare production-ready artwork for a small-batch merch sample.",
  "quantity": 100,
  "target_market": "Japan",
  "language": "en"
}
```

Create a task:

```json
{
  "title": "Custom enamel badge sample",
  "description": "Need small-batch enamel badges for a limited merch drop.",
  "product_category": "badge",
  "quantity": 200,
  "budget_range": "manual quote required",
  "target_market": "US",
  "asset_urls": ["https://example.com/artwork.png"],
  "shipping_destination": "Los Angeles, CA"
}
```

Generate a Chinese quote request:

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "language": "zh"
}
```

Generate a user-confirmable order draft:

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "user_language": "en"
}
```

Confirm the order draft:

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "confirmed": true,
  "message": "User approved the order draft."
}
```

Submit production-side feedback:

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "feasible": true,
  "confirmed_process": "hard enamel with gold electroplating",
  "quote": "6.80 CNY/unit x 200",
  "total_amount": "1360.00",
  "currency": "CNY",
  "sample_cost": "Manual confirmation required",
  "estimated_production_time": "12-15 days after sample approval",
  "estimated_shipping_time": "5-8 days",
  "risks": ["Color matching requires sample approval"]
}
```

Confirm the operator quote and risks (human gate 2):

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "accepted": true,
  "accepted_quote_id": "quote_xxxxxxxxxxxxxxxxxx",
  "accepted_risks": true,
  "message": "User accepted the quote and the stated risks."
}
```

Create a mock payment link:

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "accepted_quote_id": "quote_xxxxxxxxxxxxxxxxxx",
  "description": "Mock payment link for the accepted production quote"
}
```

The amount and currency are read from the accepted quote snapshot on the server. The caller cannot supply them. Submitting a different `accepted_quote_id` than the one the user accepted is rejected.

Confirm mock payment:

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "payment_id": "pay_mock_xxxxxxxxx",
  "confirmed": true,
  "message": "Mock payment manually confirmed."
}
```

Update production progress:

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "stage": "production_in_progress",
  "message": "Production has started after payment confirmation.",
  "production_photos": ["https://example.com/production.jpg"]
}
```

Submit shipment information:

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "carrier": "Mock Air",
  "tracking_number": "TRACK123",
  "tracking_url": "https://example.com/track/TRACK123",
  "estimated_delivery": "5-8 days"
}
```

Complete delivery:

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "completion_notes": "Delivered and confirmed by the operator.",
  "proof_urls": ["https://example.com/delivery-proof.jpg"]
}
```

Upload a sample result:

```json
{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "sample_images": ["https://example.com/sample.jpg"],
  "quoted_price": "Price requires manual confirmation.",
  "production_time": "7-10 days after sample approval",
  "supplier_feedback": "Supplier recommends hard enamel for better finish.",
  "quality_notes": "Check plating and enamel color before bulk production."
}
```

## Safety Boundaries

- No AI image generation.
- No LLM or GPU inference.
- No marketplace.
- No payment processing.
- Mock payment links are for workflow testing only and do not collect money.
- No automatic ordering.
- No arbitrary file read or write tools.
- No shell execution tools.
- No external network calls unless a future supplier API integration is explicitly requested.
- No payment information storage.
- No sensitive identity information storage.
- All supplier pricing and feasibility must be manually confirmed.
- Operator console routes require an authenticated, HTTP-only, same-site session cookie.
- Local demo, user, and acceptance routes require the same operator session.
- Failed operator logins are limited to five attempts per IP in a 15-minute window.
- Production HTTP MCP requests require a bearer API key.
- Demo and acceptance routes are disabled by default in production because they create test tasks.
- Browser cross-origin access is disabled unless an exact `CORS_ORIGIN` allowlist is configured.

## Roadmap

The next milestone is not a larger platform. It is one genuine closed-loop order initiated through an AI client and delivered by a human Reality Operator. See [ROADMAP.md](./ROADMAP.md) and [PRODUCT_SPEC.md](./PRODUCT_SPEC.md).

## License

MIT
