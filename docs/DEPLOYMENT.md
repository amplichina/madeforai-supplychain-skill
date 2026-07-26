# Production Deployment

This repository includes a conservative single-server Docker deployment shape. It keeps PostgreSQL private and binds the application to `127.0.0.1:3000`, so a public HTTPS reverse proxy must sit in front of it.

## Required Infrastructure

- A Linux server with Docker and Docker Compose
- A domain name
- An HTTPS reverse proxy such as Caddy, Nginx, or a managed cloud load balancer
- Persistent disk space for PostgreSQL
- A database backup destination

## Required Secrets

Create a server-only `.env` file. Do not commit it:

```env
POSTGRES_PASSWORD=replace-with-a-strong-database-password
DATABASE_URL=postgresql://madeforai:replace-with-a-url-safe-database-password@postgres:5432/madeforai
MCP_HTTP_API_KEY=replace-with-at-least-32-random-characters
OPERATOR_USERNAME=operator
OPERATOR_PASSWORD=replace-with-a-strong-operator-password
OPERATOR_SESSION_SECRET=replace-with-at-least-32-random-characters
CORS_ORIGIN=https://your-authorized-browser-app.example
```

Use the same database password in `POSTGRES_PASSWORD` and `DATABASE_URL`; URL-encode it when it contains reserved URL characters. The MCP API key and operator session secret must each contain at least 32 characters. The operator password must contain at least 12 characters.

Leave `CORS_ORIGIN` empty when no separate browser application needs cross-origin access. It accepts a comma-separated list of exact `http` or `https` origins and does not accept `*`.

## Start

```bash
docker compose -f docker-compose.production.yml up -d --build
```

Verify locally on the server:

```bash
curl http://127.0.0.1:3000/health
```

The expected response is:

```json
{ "ok": true }
```

## Public Routing

Route only HTTPS traffic from the public domain to `http://127.0.0.1:3000`. The intended remote MCP endpoint is:

```text
https://your-domain.example/mcp
```

Every remote MCP request must include:

```http
Authorization: Bearer your-MCP_HTTP_API_KEY
```

The production operator console is:

```text
https://your-domain.example/operator
```

Do not expose PostgreSQL port `5432` publicly. Do not expose the application directly on port `3000`.

## Operational Checklist

- Confirm HTTPS is active before using the operator console.
- Confirm `/demo`, `/user`, and `/acceptance` return `404` in production.
- Confirm `/mcp` rejects requests without the bearer API key.
- Confirm unauthorized browser origins receive no CORS allow-origin header.
- Run and review Prisma migrations before replacing a production version.
- Back up the PostgreSQL volume daily.
- Test database restoration before accepting real tasks.
- Rotate the operator password and session secret after any suspected disclosure.
- Keep real payment outside this v0.1 service.
- Keep supplier quotes, production approval, and payment confirmation human controlled.
