import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet } from "../lib/api-client.js";

interface Agency {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  total_reviews: number;
  agency_type: string | null;
  logo_url: string | null;
}

interface SearchAgenciesResponse {
  success: boolean;
  count: number;
  agencies: Agency[];
}

/**
 * Registers the search_agencies tool.
 *
 * Searches approved internship agencies (CIEE, NUBE, IEL, etc.)
 * by state, city, type, or free text query.
 * Calls GET /api/agencies on the Estagionauta API.
 */
export function registerSearchAgencies(server: McpServer): void {
  server.tool(
    "search_agencies",
    "Search Brazilian internship agencies (agências integradoras) like CIEE, NUBE, IEL, and others. Filter by state (e.g. PE, SP), city (e.g. Recife), agency type, or search by name/description.",
    {
      query: z
        .string()
        .optional()
        .describe("Free text search by agency name or description"),
      state: z
        .string()
        .optional()
        .describe("Brazilian state abbreviation (e.g. PE, SP, RJ, MG)"),
      city: z
        .string()
        .optional()
        .describe("City name (e.g. Recife, São Paulo)"),
      agencyType: z
        .enum([
          "faculdade",
          "consultoria",
          "agencia_privada",
          "orgao_publico",
          "instituto",
          "fundacao",
          "outro",
        ])
        .optional()
        .describe("Type of agency"),
    },
    async ({ query, state, city, agencyType }) => {
      try {
        const params: Record<string, string> = {};
        if (query) params.query = query;
        if (state) params.state = state;
        if (city) params.city = city;
        if (agencyType) params.agencyType = agencyType;

        const data = await apiGet<SearchAgenciesResponse>(
          "/api/agencies",
          params
        );

        if (!data.success || !data.agencies) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No agencies found matching your criteria.",
              },
            ],
          };
        }

        const result = {
          totalFound: data.count,
          agencies: data.agencies.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            city: a.city,
            state: a.state,
            rating: a.rating,
            totalReviews: a.total_reviews,
            type: a.agency_type,
            website: a.website,
            phone: a.phone,
            email: a.email,
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
              text: `Error searching agencies: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
