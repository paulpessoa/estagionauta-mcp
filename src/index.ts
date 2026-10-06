#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

/**
 * Entry point for the Estagionauta MCP Server.
 *
 * Runs in stdio mode for local usage with Claude Desktop, Gemini CLI,
 * Cursor, Windsurf, and other MCP-compatible AI clients.
 *
 * Usage:
 *   npx estagionauta-mcp
 *   node dist/index.js
 *
 * Set ESTAGIONAUTA_TOKEN to avoid passing the token on every tool call.
 */
async function main() {
  const server = createServer(process.env.ESTAGIONAUTA_TOKEN);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("Estagionauta MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
