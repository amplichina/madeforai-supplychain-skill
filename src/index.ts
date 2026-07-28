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
    { name: "madeforai-hosted-connector", version: "0.5.1" },
    { capabilities: {} },
  );
  const remoteTransport = new StreamableHTTPClientTransport(new URL(config.endpoint), {
    requestInit: {
      headers: {
        authorization: `Bearer ${config.accessToken}`,
        "x-madeforai-connector": "hosted-v0.5.1",
      },
    },
  });

  await remoteClient.connect(remoteTransport);

  const localServer = new Server(
    { name: "madeforai-supplychain-connector", version: "0.5.1" },
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
    { name: "madeforai-official-connector", version: "0.5.0" },
    { capabilities: {} },
  );
  const remoteTransport = new StreamableHTTPClientTransport(new URL(config.endpoint), {
    requestInit: {
      headers: {
        authorization: `Bearer ${config.accessToken}`,
        "x-madeforai-connector": "official-v0.5.0",
      },
    },
  });

  await remoteClient.connect(remoteTransport);

  const localServer = new Server(
    { name: "madeforai-supplychain-connector", version: "0.5.0" },
    {
      capabilities: { tools: {} },
      instructions:
        "Official MadeForAI connector. Real tasks are routed to the MadeForAI hosted control plane and remain human-approved.",
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
  console.error("MadeForAI official connector is routing tasks to api.madeforai.net.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "MadeForAI connector failed.");
  process.exit(1);
});
