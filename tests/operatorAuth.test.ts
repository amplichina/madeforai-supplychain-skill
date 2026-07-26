import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { PROTECTED_DEMO_ROUTE_PREFIXES } from "../src/mcp/server.js";
import { OperatorAuth } from "../src/operator/auth.js";

const servers: Array<ReturnType<ReturnType<typeof express>["listen"]>> = [];

async function startTestServer(auth: OperatorAuth): Promise<string> {
  const app = express();
  app.use(express.json());
  app.get("/operator/login", auth.showLogin);
  app.post("/operator/login", auth.login);
  app.post("/operator/logout", auth.requireAuth, auth.logout);
  app.get("/operator/api/private", auth.requireAuth, (_req, res) => {
    res.json({ protected: true });
  });
  app.use(PROTECTED_DEMO_ROUTE_PREFIXES, auth.requireAuth);
  for (const path of ["/demo/api/private", "/user/api/private", "/acceptance/api/private"]) {
    app.post(path, (_req, res) => {
      res.json({ protected: true });
    });
  }
  app.get("/user/private", (_req, res) => {
    res.json({ protected: true });
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

describe("operator authentication", () => {
  it("protects operator APIs and revokes the session on logout", async () => {
    const auth = new OperatorAuth({
      username: "operator",
      password: "correct-password",
      sessionSecret: "test-session-secret-that-is-long-enough",
      secureCookie: false,
    });
    const baseUrl = await startTestServer(auth);

    const denied = await fetch(`${baseUrl}/operator/api/private`);
    expect(denied.status).toBe(401);
    for (const path of ["/demo/api/private", "/user/api/private", "/acceptance/api/private"]) {
      const demoDenied = await fetch(`${baseUrl}${path}`, { method: "POST" });
      expect(demoDenied.status).toBe(401);
    }
    const userPageDenied = await fetch(`${baseUrl}/user/private`, { redirect: "manual" });
    expect(userPageDenied.status).toBe(303);
    expect(userPageDenied.headers.get("location")).toContain("return_to=%2Fuser%2Fprivate");

    const userLoginPage = await fetch(
      `${baseUrl}/operator/login?return_to=${encodeURIComponent("/user")}`,
    );
    const userLoginHtml = await userLoginPage.text();
    expect(userLoginHtml).toContain("MadeForAI demo access");
    expect(userLoginHtml).toContain("Open user workspace");
    expect(userLoginHtml).not.toContain("生产端登录");

    const operatorLoginPage = await fetch(`${baseUrl}/operator/login`);
    expect(await operatorLoginPage.text()).toContain("生产端登录");

    const wrongLogin = await fetch(`${baseUrl}/operator/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "operator", password: "wrong" }),
    });
    expect(wrongLogin.status).toBe(401);

    const login = await fetch(`${baseUrl}/operator/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "operator",
        password: "correct-password",
        return_to: "/user/private",
      }),
    });
    expect(login.status).toBe(200);
    await expect(login.clone().json()).resolves.toMatchObject({ redirect_to: "/user/private" });
    const cookie = login.headers.get("set-cookie");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/");

    const authorized = await fetch(`${baseUrl}/operator/api/private`, {
      headers: { cookie: cookie!.split(";")[0] },
    });
    expect(authorized.status).toBe(200);
    await expect(authorized.json()).resolves.toEqual({ protected: true });
    for (const path of ["/demo/api/private", "/user/api/private", "/acceptance/api/private"]) {
      const demoAuthorized = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { cookie: cookie!.split(";")[0] },
      });
      expect(demoAuthorized.status).toBe(200);
    }

    const logout = await fetch(`${baseUrl}/operator/logout`, {
      method: "POST",
      headers: { cookie: cookie!.split(";")[0] },
    });
    expect(logout.status).toBe(200);

    const revoked = await fetch(`${baseUrl}/operator/api/private`, {
      headers: { cookie: cookie!.split(";")[0] },
    });
    expect(revoked.status).toBe(401);
  });

  it("fails closed when operator credentials are missing", async () => {
    const auth = new OperatorAuth({
      username: "operator",
      secureCookie: false,
    });
    const baseUrl = await startTestServer(auth);

    const response = await fetch(`${baseUrl}/operator/api/private`);
    expect(response.status).toBe(503);
  });

  it("rate limits repeated failed logins", async () => {
    const auth = new OperatorAuth({
      username: "operator",
      password: "correct-password",
      sessionSecret: "test-session-secret-that-is-long-enough",
      secureCookie: false,
    });
    const baseUrl = await startTestServer(auth);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await fetch(`${baseUrl}/operator/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "operator", password: "wrong-password" }),
      });
      expect(response.status).toBe(401);
    }

    const blocked = await fetch(`${baseUrl}/operator/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "operator", password: "correct-password" }),
    });
    expect(blocked.status).toBe(429);
  });
});
