import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet } from "../lib/api-client.js";

interface AgencyDetails {
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

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface AgencyDetailsResponse {
  success: boolean;
  agency: AgencyDetails;
  reviews: Review[];
}

/**
 * Registers the get_agency_details tool.
 *
 * Returns detailed information and approved reviews for a specific
 * internship agency. Calls GET /api/agencies/:id on the Estagionauta API.
 */
export function registerGetAgencyDetails(server: McpServer): void {
  server.tool(
    "get_agency_details",
    "Get detailed information and student reviews for a specific internship agency. Use the agency ID obtained from search_agencies.",
    {
      agencyId: z.string().describe("The unique ID (UUID) of the agency"),
    },
    async ({ agencyId }) => {
      try {
        const data = await apiGet<AgencyDetailsResponse>(
          `/api/agencies/${agencyId}`
        );

        if (!data.success || !data.agency) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Agency not found. Please check the ID and try again.",
              },
            ],
          };
        }

        const result = {
          agency: {
            id: data.agency.id,
            name: data.agency.name,
            description: data.agency.description,
            type: data.agency.agency_type,
            city: data.agency.city,
            state: data.agency.state,
            address: data.agency.address,
            rating: data.agency.rating,
            totalReviews: data.agency.total_reviews,
            contact: {
              email: data.agency.email,
              phone: data.agency.phone,
              website: data.agency.website,
              instagram: data.agency.instagram,
            },
          },
          reviews: data.reviews.map((r) => ({
            rating: r.rating,
            comment: r.comment,
            date: r.created_at,
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
              text: `Error fetching agency details: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
