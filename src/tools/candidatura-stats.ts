import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet } from "../lib/api-client.js";

interface Application {
  id: string;
  status: string;
  salary: string | null;
}

/**
 * Registers the candidatura_stats tool.
 *
 * Computes metrics and success index based on Kanban applications.
 * Calls GET /api/kanban.
 */
export function registerCandidaturaStats(server: McpServer): void {
  server.tool(
    "candidatura_stats",
    "Get general metrics, metrics by status, and overall internship search statistics from your Kanban board.",
    {
      token: z
        .string()
        .describe("Your Estagionauta access token (JWT) for authentication"),
    },
    async ({ token }) => {
      try {
        const data = await apiGet<Application[]>("/api/kanban", undefined, token);

        if (!Array.isArray(data) || data.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No applications found. Add applications to your Kanban board first to compute statistics.",
              },
            ],
          };
        }

        const total = data.length;
        const stats: Record<string, number> = {
          interested: 0,
          applied: 0,
          test: 0,
          group_dynamics: 0,
          interview: 0,
          cultural_fit: 0,
          resource: 0,
          offer: 0,
          hired: 0,
          rejected: 0,
        };

        let totalSalary = 0;
        let salaryCount = 0;

        data.forEach((app) => {
          if (app.status in stats) {
            stats[app.status]++;
          }
          if (app.salary) {
            // Clean BRL string (R$ 1.500,00 -> 1500)
            const cleanVal = app.salary
              .replace(/[^\d,.-]/g, "")
              .replace(/\./g, "")
              .replace(",", ".");
            const val = parseFloat(cleanVal);
            if (!isNaN(val)) {
              totalSalary += val;
              salaryCount++;
            }
          }
        });

        const activeProcesses =
          total - (stats.hired + stats.rejected);

        const metrics = {
          totalApplications: total,
          activeProcesses,
          hiredCount: stats.hired,
          rejectionsCount: stats.rejected,
          offersReceived: stats.offer,
          interviewsCount: stats.interview,
          averageSalaryOffered:
            salaryCount > 0
              ? `R$ ${parseFloat((totalSalary / salaryCount).toFixed(2))}`
              : "No salary data available",
          statusDistribution: stats,
          conversionRate: {
            applicationToInterview:
              total > 0
                ? `${((stats.interview / total) * 100).toFixed(1)}%`
                : "0%",
            interviewToOffer:
              stats.interview > 0
                ? `${((stats.offer / stats.interview) * 100).toFixed(1)}%`
                : "0%",
            successRate:
              total > 0
                ? `${((stats.hired / total) * 100).toFixed(1)}%`
                : "0%",
          },
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(metrics, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error calculating stats: ${error.message}. Please check if your token is valid.`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
