import "dotenv/config";
import { createInMemorySupplyChainStore } from "./db/inMemoryStore.js";
import { startHttpServer, startStdioServer } from "./mcp/server.js";
import { createPrismaSupplyChainStore } from "./tools/index.js";

function getTransportMode(argv: string[]): "stdio" | "http" {
  if (argv.includes("--http")) return "http";
  if (argv.includes("--stdio")) return "stdio";
  return process.env.MCP_TRANSPORT === "http" ? "http" : "stdio";
}

async function main(): Promise<void> {
  const store =
    process.env.MCP_DEV_MEMORY_STORE === "true"
      ? createInMemorySupplyChainStore()
      : createPrismaSupplyChainStore((await import("./db/prisma.js")).prisma);
  const mode = getTransportMode(process.argv);

  if (mode === "http") {
    const port = Number.parseInt(process.env.PORT ?? "3000", 10);
    await startHttpServer(store, port);
    return;
  }

  await startStdioServer(store);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
