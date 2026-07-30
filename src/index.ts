#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { resolveConnectorConfig } from "./config.js";
import { assertPublicToolName, isPublicToolName } from "./publicTools.js";

async function main(): Promise<void> {
  const config = resolveConnectorConfig();
  const remoteClient = new Client(
    { name: "madeforai-hosted-connector", version: "0.5.2" },
    { capabilities: {} },
  );
  const remoteTransport = new StreamableHTTPClientTransport(new URL(config.endpoint), {
    requestInit: {
      headers: {
        authorization: `Bearer ${config.accessToken}`,
        "x-madeforai-connector": "hosted-v0.5.2",
      },
    },
  });

  await remoteClient.connect(remoteTransport);

  const localServer = new Server(
    { name: "madeforai-supplychain-connector", version: "0.5.2" },
    {
      capabilities: { tools: {} },
      instructions:
        "MadeForAI hosted connector. Requests are forwarded to the MadeForAI control plane, where irreversible steps require manual approval before they proceed.",
    },
  );

  localServer.setRequestHandler(ListToolsRequestSchema, async () => {
    const result = await remoteClient.listTools();
    return {
      ...result,
      tools: result.tools.filter((tool) => isPublicToolName(tool.name)),
    };
  });

  localServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    assertPublicToolName(request.params.name);
    return remoteClient.callTool(request.params);
  });

  const close = async () => {
    await localServer.close();
    await remoteClient.close();
  };
  process.once("SIGINT", () => void close().finally(() => process.exit(0)));
  process.once("SIGTERM", () => void close().finally(() => process.exit(0)));

  await localServer.connect(new StdioServerTransport());
  console.error("MadeForAI hosted connector is routing tasks to api.madeforai.net.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "MadeForAI connector failed.");
  process.exit(1);
});
