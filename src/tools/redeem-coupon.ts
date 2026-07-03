import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiPost } from "../lib/api-client.js";

interface RedeemCouponResponse {
  success: boolean;
  message: string;
  creditsAdded: number;
}

/**
 * Registers the redeem_coupon tool.
 *
 * Redeems a promotional coupon code to add credits to the user's account.
 * Calls POST /api/credits/redeem.
 */
export function registerRedeemCoupon(server: McpServer): void {
  server.tool(
    "redeem_coupon",
    "Redeem a promotional coupon code (e.g. ESTAGIO100, BOASVINDAS) to add credits to your Estagionauta account. Requires your authentication token and the coupon code.",
    {
      token: z
        .string()
        .describe("Your Estagionauta access token (JWT) for authentication"),
      code: z
        .string()
        .describe("The coupon code to redeem (case-insensitive, e.g. 'ESTAGIO100')"),
    },
    async ({ token, code }) => {
      try {
        const data = await apiPost<RedeemCouponResponse>(
          "/api/credits/redeem",
          { code },
          token
        );

        const result = {
          success: data.success,
          message: data.message,
          creditsAdded: data.creditsAdded,
        };

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
              text: `Error redeeming coupon: ${error.message}. Please check if the coupon code is valid, has not expired, or has not been redeemed already.`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
