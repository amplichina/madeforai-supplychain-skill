import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let server: Server;
let baseUrl: string;
let operatorCookie = "";

const password = "e2e-password-123456";

beforeAll(async () => {
  process.env.MCP_DEV_MEMORY_STORE = "true";
  process.env.ENABLE_DEMO_ROUTES = "true";
  process.env.OPERATOR_USERNAME = "operator";
  process.env.OPERATOR_PASSWORD = password;
  process.env.OPERATOR_SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.OPERATOR_COOKIE_SECURE = "false";

  const { createHttpApp } = await import("../src/mcp/server.js");
  const { createInMemoryStore } = await import("./inMemoryStore.js");
  const app = createHttpApp(createInMemoryStore());
  server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const address = server.address() as { port: number };
  baseUrl = `http://127.0.0.1:${address.port}`;

  const login = await fetch(`${baseUrl}/operator/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "operator", password }),
  });
  operatorCookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
  expect(operatorCookie).not.toBe("");
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("web workflow routes", () => {
  it("serves the protected 60-second competition POC", async () => {
    const anonymous = await fetch(`${baseUrl}/poc`, { redirect: "manual" });
    expect([301, 302, 303, 401, 403]).toContain(anonymous.status);

    const authenticated = await fetch(`${baseUrl}/poc`, {
      headers: { cookie: operatorCookie },
    });
    const html = await authenticated.text();
    expect(authenticated.status).toBe(200);
    expect(html).toContain("60 秒实机 POC");
    expect(html).toContain('fetch("/user/api/run"');
    expect(html).toContain("No automatic ordering");
  });

  it("runs the protected demo through quality check and delivery", async () => {
    const response = await fetch(`${baseUrl}/demo/api/run`, {
      method: "POST",
      headers: { cookie: operatorCookie },
    });
    const raw = await response.text();
    expect(response.status, raw.slice(0, 500)).toBe(200);
    expect(raw).toContain("1280.00");
    expect(raw).toContain('"status":"completed"');
    expect(raw).toContain('"stage":"quality_check"');
  });

  it("runs the user workspace demo through quality check before shipment", async () => {
    const response = await fetch(`${baseUrl}/user/api/run`, {
      method: "POST",
      headers: { cookie: operatorCookie },
    });
    const raw = await response.text();
    expect(response.status, raw.slice(0, 500)).toBe(200);
    expect(raw).toContain('"quality_check_status":"quality_check"');
    expect(raw).toContain('"final_status":"completed"');
  });

  it("exposes created demo tasks through the operator API", async () => {
    const response = await fetch(`${baseUrl}/operator/api/tasks`, {
      headers: { cookie: operatorCookie },
    });
    expect(response.status).toBe(200);
    const tasks = (await response.json()) as Array<{ task_id: string }>;
    expect(tasks.length).toBeGreaterThan(0);

    const detail = await fetch(`${baseUrl}/operator/api/tasks/${tasks[0].task_id}`, {
      headers: { cookie: operatorCookie },
    });
    expect(detail.status).toBe(200);
  });

  it("keeps the operator console authenticated and quote-ready", async () => {
    const anonymous = await fetch(`${baseUrl}/operator`, { redirect: "manual" });
    expect([301, 302, 303, 401, 403]).toContain(anonymous.status);

    const authenticated = await fetch(`${baseUrl}/operator`, {
      headers: { cookie: operatorCookie },
    });
    expect(authenticated.status).toBe(200);
    const html = await authenticated.text();
    expect(html).toContain("total_amount");
    expect(html).toContain("宣传印刷品");
    expect(html).toContain("展会与门店物料");
    expect(html).toContain("服装与工服");
  });
});
