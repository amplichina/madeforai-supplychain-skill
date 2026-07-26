import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export interface McpHttpAuthConfig {
  apiKey?: string;
  required: boolean;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: string, right: string): boolean {
  return timingSafeEqual(digest(left), digest(right));
}

function bearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  const token = header.slice("Bearer ".length).trim();
  return token || undefined;
}

export class McpHttpAuth {
  constructor(private readonly config: McpHttpAuthConfig) {}

  get configured(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.length >= 32);
  }

  requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (!this.config.required && !this.config.apiKey) {
      next();
      return;
    }

    if (!this.configured) {
      res.status(503).json({
        error: "Remote MCP access is locked until MCP_HTTP_API_KEY is configured.",
      });
      return;
    }

    const supplied = bearerToken(req);
    if (!supplied || !safeEqual(supplied, this.config.apiKey!)) {
      res.setHeader("WWW-Authenticate", "Bearer");
      res.status(401).json({ error: "Invalid or missing MCP API key." });
      return;
    }

    next();
  };
}

export function createMcpHttpAuthFromEnvironment(): McpHttpAuth {
  return new McpHttpAuth({
    apiKey: process.env.MCP_HTTP_API_KEY,
    required:
      process.env.NODE_ENV === "production" || process.env.MCP_HTTP_AUTH_REQUIRED === "true",
  });
}
