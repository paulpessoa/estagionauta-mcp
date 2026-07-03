import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet } from "../lib/api-client.js";

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
  appliedDate: string;
  description: string;
  salary: string | null;
  location: string;
  progress: number;
  nextAction: string | null;
  nextActionDate: string | null;
  notes: string;
  tags: string[];
}

/**
 * Registers the check_candidatures tool.
 *
 * Fetches all internship applications on the user's Kanban board.
 * Calls GET /api/kanban.
 */
export function registerCheckCandidatures(server: McpServer): void {
  server.tool(
    "check_candidatures",
    "List your internship applications (candidaturas) registered in your Kanban board on Estagionauta. View company, position, current status, progress, and salary details.",
    {
      token: z
        .string()
        .describe("Your Estagionauta access token (JWT) for authentication"),
      status: z
        .enum([
          "interested",
          "applied",
          "test",
          "group_dynamics",
          "interview",
          "cultural_fit",
          "resource",
          "offer",
          "hired",
          "rejected",
        ])
        .optional()
        .describe("Filter applications by status (e.g. 'interview', 'offer')"),
    },
    async ({ token, status }) => {
      try {
        const data = await apiGet<Application[]>("/api/kanban", undefined, token);

        if (!Array.isArray(data) || data.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No internship applications found on your Kanban board.",
              },
            ],
          };
        }

        let filtered = data;
        if (status) {
          filtered = data.filter((app) => app.status === status);
        }

        const result = {
          success: true,
          count: filtered.length,
          applications: filtered.map((app) => ({
            id: app.id,
            company: app.company,
            position: app.position,
            status: app.status,
            progress: `${app.progress}%`,
            appliedDate: app.appliedDate,
            salary: app.salary || "Not informed",
            location: app.location || "Not informed",
            nextAction: app.nextAction,
            nextActionDate: app.nextActionDate,
            tags: app.tags,
          })),
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
              text: `Error fetching applications: ${error.message}. Please check if your token is valid.`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
