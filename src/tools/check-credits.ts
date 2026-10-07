import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, requireToken } from "../lib/api-client.js";

interface CreditBalanceResponse {
  credits: number;
  total_credits_used: number;
  total_credits_purchased: number;
  subscription_status: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

/**
 * Registers the check_credits tool.
 *
 * Fetches the credit balance and recent transaction history for a user.
 * Calls GET /api/credits and GET /api/credits/transactions.
 */
export function registerCheckCredits(server: McpServer, authToken?: string): void {
  server.tool(
    "check_credits",
    "Check your Estagionauta credit balance, subscription status, and optionally view recent transaction history.",
    {
      token: z
        .string()
        .optional()
        .describe("Your Estagionauta access token (JWT). Optional when the connection already sends an Authorization header"),
      includeHistory: z
        .boolean()
        .optional()
        .default(false)
        .describe("Set to true to also fetch the recent credit transactions list"),
    },
    async ({ token, includeHistory }) => {
      try {
        const jwt = requireToken(token, authToken);
        // 1. Fetch balance
        const balance = await apiGet<CreditBalanceResponse>(
          "/api/credits",
          undefined,
          jwt
        );

        const result: Record<string, any> = {
          success: true,
          balance: {
            availableCredits: balance.credits,
            totalUsed: balance.total_credits_used,
            totalPurchased: balance.total_credits_purchased,
            plan: balance.subscription_status,
          },
        };

        // 2. Fetch history if requested
        if (includeHistory) {
          const transactions = await apiGet<Transaction[]>(
            "/api/credits/transactions",
            undefined,
            jwt
          );
          result.history = transactions.map((t) => ({
            id: t.id,
            amount: t.amount,
            type: t.type,
            description: t.description,
            date: t.created_at,
          }));
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error fetching credit details: ${error.message}. Please check if your token is valid.`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
