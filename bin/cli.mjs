#!/usr/bin/env node
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || "3000";
const username = process.env.OPERATOR_USERNAME || "operator";
const password = process.env.OPERATOR_PASSWORD || `demo-${randomBytes(6).toString("hex")}`;
const sessionSecret =
  process.env.OPERATOR_SESSION_SECRET || randomBytes(24).toString("hex");
const distEntry = path.join(root, "dist", "src", "index.js");
const sourceEntry = path.join(root, "src", "index.ts");
const hasDist = existsSync(distEntry);

if (!hasDist && !existsSync(sourceEntry)) {
  console.error("MadeForAI could not find dist/src/index.js or src/index.ts.");
  process.exit(1);
}

const serverCommand = hasDist ? process.execPath : "npx";
const serverArgs = hasDist ? [distEntry, "--http"] : ["tsx", sourceEntry, "--http"];
const stdioCommand = hasDist ? process.execPath : "npx";
const stdioArgs = hasDist ? [distEntry, "--stdio"] : ["tsx", sourceEntry, "--stdio"];
const env = {
  ...process.env,
  MCP_DEV_MEMORY_STORE: "true",
  MCP_TRANSPORT: "http",
  PORT: port,
  OPERATOR_USERNAME: username,
  OPERATOR_PASSWORD: password,
  OPERATOR_SESSION_SECRET: sessionSecret,
};
const normalizedStdioArgs = stdioArgs.map((value) => value.replaceAll("\\", "/"));

console.log(`
MadeForAI Supply Chain Skill
Zero-config local demo · in-memory mode · nothing is persisted

  User workspace    http://localhost:${port}/user
  Operator console  http://localhost:${port}/operator
  MCP endpoint      http://localhost:${port}/mcp

  Operator login    ${username}
  Temporary password ${password}

Claude Desktop / local MCP configuration:
${JSON.stringify(
  {
    mcpServers: {
      madeforai: {
        command: stdioCommand.replaceAll("\\", "/"),
        args: normalizedStdioArgs,
        env: { MCP_DEV_MEMORY_STORE: "true" },
      },
    },
  },
  null,
  2,
)}

Run the complete workflow test in another terminal:
  npm run smoke:http

Stop this demo with Ctrl+C.
`);

const child = spawn(serverCommand, serverArgs, {
  cwd: root,
  env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`MadeForAI failed to start: ${error.message}`);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 0));
