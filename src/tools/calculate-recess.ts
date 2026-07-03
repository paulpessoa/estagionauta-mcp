import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the calculate_recess tool.
 *
 * Calculates internship recess (vacation) days and payment based on
 * Brazilian Internship Law (Lei nº 11.788/2008).
 *
 * This tool runs entirely locally — no API call needed.
 */
export function registerCalculateRecess(server: McpServer): void {
  server.tool(
    "calculate_recess",
    "Calculate internship recess (vacation) days and proportional payment based on Brazilian Internship Law (Lei nº 11.788/2008). Provide the start date, optional end date, and monthly stipend.",
    {
      startDate: z
        .string()
        .describe("Internship start date in YYYY-MM-DD format"),
      endDate: z
        .string()
        .optional()
        .describe(
          "Internship end date in YYYY-MM-DD format (defaults to today)"
        ),
      salary: z
        .number()
        .positive()
        .describe("Monthly stipend in BRL (e.g. 1200.00)"),
    },
    async ({ startDate, endDate, salary }) => {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();

      if (isNaN(start.getTime())) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Invalid start date. Please use YYYY-MM-DD format.",
            },
          ],
        };
      }

      if (isNaN(end.getTime())) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Invalid end date. Please use YYYY-MM-DD format.",
            },
          ],
        };
      }

      // Calculate days between dates (UTC to avoid timezone issues)
      const utcStart = Date.UTC(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      const utcEnd = Date.UTC(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );

      const diffTime = utcEnd - utcStart;
      const diffDays = Math.max(
        0,
        Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      );

      // Calculate months worked (fraction of 15+ days counts as a full month)
      const fullMonths = Math.floor(diffDays / 30);
      const remainderDays = diffDays % 30;
      const monthsWorked = remainderDays >= 15 ? fullMonths + 1 : fullMonths;

      // For every 12 months, student gets 30 days of recess
      const recessDays = Math.max(
        0,
        Math.floor((monthsWorked / 12) * 30)
      );

      // Calculate payment
      const dailySalary = salary / 30;
      const recessPayment = recessDays * dailySalary;

      const result = {
        monthsWorked,
        totalDaysWorked: diffDays,
        recessDays,
        recessPayment: parseFloat(recessPayment.toFixed(2)),
        dailySalary: parseFloat(dailySalary.toFixed(2)),
        period: {
          start: startDate,
          end: endDate || new Date().toISOString().split("T")[0],
        },
        formula:
          "Recess Days = (Months Worked ÷ 12) × 30 | Payment = Recess Days × (Monthly Salary ÷ 30)",
        law: "Lei nº 11.788/2008 (Brazilian Internship Law)",
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
