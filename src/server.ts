import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCalculateRecess } from "./tools/calculate-recess.js";
import { registerSearchAgencies } from "./tools/search-agencies.js";
import { registerGetAgencyDetails } from "./tools/get-agency-details.js";
import { registerCheckCredits } from "./tools/check-credits.js";
import { registerRedeemCoupon } from "./tools/redeem-coupon.js";
import { registerCheckCandidatures } from "./tools/check-candidatures.js";
import { registerCandidaturaStats } from "./tools/candidatura-stats.js";

/**
 * Creates and configures the Estagionauta MCP Server.
 * Registers all available tools for AI clients (Claude, Gemini, Cursor, etc.)
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "estagionauta-mcp",
    version: "0.1.0",
    description:
      "AI-powered internship tools for Brazilian students. Calculate recess days, search internship agencies, and get agency details — all from your favorite AI assistant.",
  });

  // Register tools
  registerCalculateRecess(server);
  registerSearchAgencies(server);
  registerGetAgencyDetails(server);
  registerCheckCredits(server);
  registerRedeemCoupon(server);
  registerCheckCandidatures(server);
  registerCandidaturaStats(server);

  return server;
}


