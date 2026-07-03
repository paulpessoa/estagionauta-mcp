import { createServer } from "./server.js";
import { createMcpHandler } from "agents/mcp";

const server = createServer();

/**
 * Cloudflare Worker entry point.
 * Exposes the Estagionauta MCP Server via Streamable HTTP (Fetch handler).
 *
 * Deploy using Cloudflare Workers.
 */
export default {
  fetch: createMcpHandler(server),
};
