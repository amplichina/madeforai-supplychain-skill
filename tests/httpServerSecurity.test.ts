import type { AddressInfo } from "node:net";
import cors from "cors";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { McpHttpAuth } from "../src/mcp/httpAuth.js";
import {
  parseCorsOrigins,
  PROTECTED_DEMO_ROUTE_PREFIXES,
  shouldEnableDemoRoutes,
} from "../src/mcp/server.js";

const servers: Array<ReturnType<ReturnType<typeof express>["listen"]>> = [];

async function startTestServer(auth: McpHttpAuth): Promise<string> {
  const app = express();
  app.post("/mcp", auth.requireAuth, (_req, res) => {
    res.json({ authorized: true });
  });

  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function startCorsTestServer(origins: string[] | false): Promise<string> {
  const app = express();
  app.use(cors({ origin: origins }));
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

describe("HTTP server security", () => {
  it("keeps demo routes available locally and disabled by default in production", () => {
    expect(shouldEnableDemoRoutes({ NODE_ENV: "development" })).toBe(true);
    expect(shouldEnableDemoRoutes({ NODE_ENV: "production" })).toBe(false);
    expect(shouldEnableDemoRoutes({ NODE_ENV: "production", ENABLE_DEMO_ROUTES: "true" })).toBe(
      false,
    );
    expect(PROTECTED_DEMO_ROUTE_PREFIXES).toEqual(["/demo", "/user", "/acceptance"]);
  });

  it("defaults CORS to disabled and validates explicit origins", () => {
    expect(parseCorsOrigins(undefined)).toBe(false);
    expect(parseCorsOrigins(" https://app.example.com/, http://localhost:5173 ")).toEqual([
      "https://app.example.com",
      "http://localhost:5173",
    ]);
    expect(() => parseCorsOrigins("*")).toThrow("wildcard");
    expect(() => parseCorsOrigins("https://app.example.com/path")).toThrow("must not include");
  });

  it("returns CORS headers only for an allowed browser origin", async () => {
    const baseUrl = await startCorsTestServer(["https://allowed.example"]);

    const allowed = await fetch(`${baseUrl}/health`, {
      headers: { origin: "https://allowed.example" },
    });
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("access-control-allow-origin")).toBe("https://allowed.example");

    const blocked = await fetch(`${baseUrl}/health`, {
      headers: { origin: "https://blocked.example" },
    });
    expect(blocked.status).toBe(200);
    expect(blocked.headers.get("access-control-allow-origin")).toBeNull();

    const serverToServer = await fetch(`${baseUrl}/health`);
    expect(serverToServer.status).toBe(200);
    expect(serverToServer.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("allows an explicitly open local MCP endpoint", async () => {
    const baseUrl = await startTestServer(new McpHttpAuth({ required: false }));
    const response = await fetch(`${baseUrl}/mcp`, { method: "POST" });
    expect(response.status).toBe(200);
  });

  it("fails closed when remote MCP authentication is required but missing", async () => {
    const baseUrl = await startTestServer(new McpHttpAuth({ required: true }));
    const response = await fetch(`${baseUrl}/mcp`, { method: "POST" });
    expect(response.status).toBe(503);
  });

  it("requires the configured bearer API key", async () => {
    const apiKey = "test-mcp-api-key-with-at-least-32-characters";
    const baseUrl = await startTestServer(new McpHttpAuth({ required: true, apiKey }));

    const denied = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { authorization: "Bearer wrong-key" },
    });
    expect(denied.status).toBe(401);

    const allowed = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    expect(allowed.status).toBe(200);
  });
});
