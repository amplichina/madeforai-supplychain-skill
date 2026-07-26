import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const SESSION_COOKIE = "madeforai_operator_session";
const DEFAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const RETURN_PATH_PREFIXES = ["/operator", "/demo", "/user", "/acceptance"];

export interface OperatorAuthConfig {
  username: string;
  password?: string;
  sessionSecret?: string;
  secureCookie: boolean;
  sessionTtlMs?: number;
}

interface Session {
  username: string;
  expiresAt: number;
}

interface LoginAttempt {
  failures: number;
  windowStartedAt: number;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: string, right: string): boolean {
  return timingSafeEqual(digest(left), digest(right));
}

function readCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    const key = pair.slice(0, separator).trim();
    if (key !== name) continue;
    return decodeURIComponent(pair.slice(separator + 1).trim());
  }
  return undefined;
}

function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/operator";
  }
  return RETURN_PATH_PREFIXES.some(
    (prefix) =>
      value === prefix || value.startsWith(`${prefix}/`) || value.startsWith(`${prefix}?`),
  )
    ? value
    : "/operator";
}

function loginPage(configured: boolean, returnTo: string): string {
  const userFacing = returnTo === "/user" || returnTo.startsWith("/user/");
  const copy = userFacing
    ? {
        lang: "en",
        title: "MadeForAI demo access",
        heading: "MadeForAI demo access",
        subtitle: "Enter the local demo credentials to open the AI-side user workspace.",
        username: "Username",
        password: "Password",
        submit: "Open user workspace",
        configurationNotice:
          "Demo access is not configured. Set OPERATOR_PASSWORD and OPERATOR_SESSION_SECRET on the local server, then restart it.",
        loginFailed: "Invalid username or password.",
      }
    : {
        lang: "zh-CN",
        title: "登录 MadeForAI 生产端",
        heading: "生产端登录",
        subtitle: "仅供 Reality Operator 和授权生产人员使用。",
        username: "账号",
        password: "密码",
        submit: "登录生产后台",
        configurationNotice:
          "生产后台尚未配置登录密码。请在服务器环境变量中设置 OPERATOR_PASSWORD 和 OPERATOR_SESSION_SECRET 后重启。",
        loginFailed: "登录失败",
      };
  const configurationNotice = configured
    ? ""
    : `<div class="notice error">
         ${copy.configurationNotice
           .replace("OPERATOR_PASSWORD", "<code>OPERATOR_PASSWORD</code>")
           .replace("OPERATOR_SESSION_SECRET", "<code>OPERATOR_SESSION_SECRET</code>")}
       </div>`;

  return `<!doctype html>
<html lang="${copy.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${copy.title}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 16px;
        background: #eef2f6;
        color: #17202a;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      }
      main {
        width: min(390px, calc(100vw - 32px));
        background: #fff;
        border: 1px solid #d9dee7;
        border-radius: 8px;
        padding: 28px;
        box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
      }
      h1 { margin: 0; font-size: 23px; }
      .subtitle { margin: 8px 0 22px; color: #64748b; line-height: 1.6; font-size: 14px; }
      form { display: grid; gap: 15px; }
      label { display: grid; gap: 6px; font-size: 14px; font-weight: 700; }
      input {
        width: 100%;
        min-height: 42px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 8px 10px;
        font: inherit;
      }
      input:focus { outline: 3px solid #ccfbf1; border-color: #0f766e; }
      button {
        min-height: 42px;
        border: 0;
        border-radius: 6px;
        background: #0f766e;
        color: #fff;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      button:disabled { opacity: 0.55; cursor: wait; }
      .notice {
        margin-bottom: 16px;
        border-left: 4px solid #0f766e;
        background: #ecfdf5;
        padding: 10px 12px;
        color: #065f46;
        font-size: 13px;
        line-height: 1.55;
      }
      .notice.error { border-color: #b42318; background: #fff1f0; color: #8a1c13; }
      #message { min-height: 20px; margin: 0; color: #b42318; font-size: 13px; }
      code { overflow-wrap: anywhere; }
    </style>
  </head>
  <body>
    <main>
      <h1>${copy.heading}</h1>
      <p class="subtitle">${copy.subtitle}</p>
      ${configurationNotice}
      <form id="loginForm">
        <label>${copy.username}<input name="username" autocomplete="username" required /></label>
        <label>${copy.password}<input name="password" type="password" autocomplete="current-password" required /></label>
        <p id="message" role="alert"></p>
        <button type="submit"${configured ? "" : " disabled"}>${copy.submit}</button>
      </form>
    </main>
    <script>
      document.getElementById("loginForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const button = form.querySelector("button");
        const message = document.getElementById("message");
        const data = {
          ...Object.fromEntries(new FormData(form).entries()),
          return_to: ${JSON.stringify(returnTo)}
        };
        button.disabled = true;
        message.textContent = "";
        try {
          const response = await fetch("/operator/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(data)
          });
          const result = await response.json();
          if (!response.ok) throw new Error(${JSON.stringify(copy.loginFailed)});
          window.location.replace(result.redirect_to || "/operator");
        } catch (error) {
          message.textContent = error instanceof Error ? error.message : ${JSON.stringify(
            copy.loginFailed,
          )};
          button.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
}

export class OperatorAuth {
  private readonly sessions = new Map<string, Session>();
  private readonly attempts = new Map<string, LoginAttempt>();
  private readonly sessionTtlMs: number;

  constructor(private readonly config: OperatorAuthConfig) {
    this.sessionTtlMs = config.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
  }

  get configured(): boolean {
    return Boolean(
      this.config.password &&
      this.config.password.length >= 12 &&
      this.config.sessionSecret &&
      this.config.sessionSecret.length >= 32,
    );
  }

  showLogin = (req: Request, res: Response): void => {
    const returnTo = safeReturnPath(req.query.return_to);
    res
      .status(this.configured ? 200 : 503)
      .type("html")
      .send(loginPage(this.configured, returnTo));
  };

  login = (req: Request, res: Response): void => {
    if (!this.configured) {
      res.status(503).json({ error: "生产后台尚未配置登录密码，请联系系统管理员。" });
      return;
    }

    const attemptKey = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const attempt = this.attempts.get(attemptKey);
    if (attempt && now - attempt.windowStartedAt < LOGIN_WINDOW_MS) {
      if (attempt.failures >= MAX_LOGIN_FAILURES) {
        res.status(429).json({ error: "登录失败次数过多，请在 15 分钟后重试。" });
        return;
      }
    } else if (attempt) {
      this.attempts.delete(attemptKey);
    }

    const username = typeof req.body?.username === "string" ? req.body.username : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!safeEqual(username, this.config.username) || !safeEqual(password, this.config.password!)) {
      const current = this.attempts.get(attemptKey);
      this.attempts.set(attemptKey, {
        failures: (current?.failures ?? 0) + 1,
        windowStartedAt: current?.windowStartedAt ?? now,
      });
      res.status(401).json({ error: "账号或密码错误。" });
      return;
    }

    this.attempts.delete(attemptKey);
    this.pruneExpiredSessions(now);
    const sessionId = randomBytes(32).toString("base64url");
    const signature = this.sign(sessionId);
    this.sessions.set(sessionId, {
      username: this.config.username,
      expiresAt: now + this.sessionTtlMs,
    });
    res.cookie(SESSION_COOKIE, `${sessionId}.${signature}`, {
      httpOnly: true,
      sameSite: "strict",
      secure: this.config.secureCookie,
      path: "/",
      maxAge: this.sessionTtlMs,
    });
    res.json({ ok: true, redirect_to: safeReturnPath(req.body?.return_to) });
  };

  logout = (req: Request, res: Response): void => {
    const sessionId = this.validSessionId(req);
    if (sessionId) this.sessions.delete(sessionId);
    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      sameSite: "strict",
      secure: this.config.secureCookie,
      path: "/",
    });
    res.json({ ok: true });
  };

  requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (!this.configured) {
      if (this.wantsLoginPage(req)) {
        res.redirect(303, `/operator/login?return_to=${encodeURIComponent(req.originalUrl)}`);
      } else {
        res.status(503).json({ error: "生产后台尚未配置登录密码。" });
      }
      return;
    }

    if (!this.validSessionId(req)) {
      if (this.wantsLoginPage(req)) {
        res.redirect(303, `/operator/login?return_to=${encodeURIComponent(req.originalUrl)}`);
      } else {
        res.status(401).json({ error: "请先登录生产后台。" });
      }
      return;
    }
    next();
  };

  private wantsLoginPage(req: Request): boolean {
    return req.method === "GET" && !req.originalUrl.startsWith("/operator/api/");
  }

  private sign(sessionId: string): string {
    return createHmac("sha256", this.config.sessionSecret!).update(sessionId).digest("base64url");
  }

  private pruneExpiredSessions(now: number): void {
    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt <= now) this.sessions.delete(sessionId);
    }
  }

  private validSessionId(req: Request): string | undefined {
    const token = readCookie(req, SESSION_COOKIE);
    if (!token) return undefined;
    const separator = token.lastIndexOf(".");
    if (separator < 1) return undefined;
    const sessionId = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!safeEqual(signature, this.sign(sessionId))) return undefined;

    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    return sessionId;
  }
}

export function createOperatorAuthFromEnvironment(): OperatorAuth {
  return new OperatorAuth({
    username: process.env.OPERATOR_USERNAME?.trim() || "operator",
    password: process.env.OPERATOR_PASSWORD,
    sessionSecret: process.env.OPERATOR_SESSION_SECRET,
    secureCookie:
      process.env.OPERATOR_COOKIE_SECURE === "true" ||
      (process.env.NODE_ENV === "production" && process.env.OPERATOR_COOKIE_SECURE !== "false"),
  });
}
