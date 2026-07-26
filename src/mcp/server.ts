import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerSupplyChainTools } from "./tools.js";
import type { SupplyChainStore } from "../tools/index.js";
import { registerOperatorRoutes } from "../operator/routes.js";
import { registerDemoRoutes } from "../demo/routes.js";
import { registerAcceptanceRoutes } from "../acceptance/routes.js";
import { createOperatorAuthFromEnvironment } from "../operator/auth.js";
import { createMcpHttpAuthFromEnvironment } from "./httpAuth.js";

export const PROTECTED_DEMO_ROUTE_PREFIXES: string[] = ["/demo", "/user", "/acceptance"];

export function parseCorsOrigins(value: string | undefined): string[] | false {
  if (!value?.trim()) return false;

  const origins = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      if (item === "*") {
        throw new Error("CORS_ORIGIN must list explicit origins; wildcard '*' is not allowed.");
      }

      let url: URL;
      try {
        url = new URL(item);
      } catch {
        throw new Error(`Invalid CORS origin: ${item}`);
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error(`CORS origin must use http or https: ${item}`);
      }
      if (
        url.username ||
        url.password ||
        (url.pathname !== "/" && url.pathname !== "") ||
        url.search ||
        url.hash
      ) {
        throw new Error(
          `CORS origin must not include credentials, a path, query, or fragment: ${item}`,
        );
      }
      return url.origin;
    });

  return [...new Set(origins)];
}

export function createMadeForAiMcpServer(store: SupplyChainStore): McpServer {
  const server = new McpServer({
    name: "madeforai-supplychain-skill",
    version: "0.3.0",
  });

  registerSupplyChainTools(server, store);
  return server;
}

export async function startStdioServer(store: SupplyChainStore): Promise<void> {
  const server = createMadeForAiMcpServer(store);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export function shouldEnableDemoRoutes(env: NodeJS.ProcessEnv): boolean {
  if (env.NODE_ENV === "production") return false;
  if (env.ENABLE_DEMO_ROUTES !== undefined) return env.ENABLE_DEMO_ROUTES === "true";
  return true;
}

export function createHttpApp(store: SupplyChainStore): express.Express {
  const app = express();
  if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
  app.use(cors({ origin: parseCorsOrigins(process.env.CORS_ORIGIN) }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  const operatorAuth = createOperatorAuthFromEnvironment();
  if (shouldEnableDemoRoutes(process.env)) {
    app.use(PROTECTED_DEMO_ROUTE_PREFIXES, operatorAuth.requireAuth);
    registerDemoRoutes(app, store);
    registerAcceptanceRoutes(app, store);
  }
  if (!operatorAuth.configured) {
    console.error(
      "Operator console is locked: set OPERATOR_PASSWORD and OPERATOR_SESSION_SECRET to enable login.",
    );
  }
  registerOperatorRoutes(app, store, operatorAuth);

  const mcpHttpAuth = createMcpHttpAuthFromEnvironment();
  if (process.env.NODE_ENV === "production" && !mcpHttpAuth.configured) {
    console.error("Remote MCP endpoint is locked: set MCP_HTTP_API_KEY to at least 32 characters.");
  }

  app.post("/mcp", mcpHttpAuth.requireAuth, async (req, res) => {
    const server = createMadeForAiMcpServer(store);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", mcpHttpAuth.requireAuth, (_req, res) => {
    res.status(405).json({
      error: "Use POST /mcp for MCP JSON-RPC requests. Use GET /health for health checks.",
    });
  });

  return app;
}

export async function startHttpServer(store: SupplyChainStore, port: number): Promise<void> {
  const app = createHttpApp(store);
  app.listen(port, () => {
    console.error(`MadeForAI Supply Chain Skill HTTP server listening on port ${port}`);
  });
}
