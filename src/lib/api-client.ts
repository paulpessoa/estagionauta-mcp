/**
 * HTTP client for the Estagionauta API.
 * Makes server-to-server requests to the Hono.js backend.
 */

const API_URL =
  process.env.ESTAGIONAUTA_API_URL ||
  "https://estagionauta-api-991344207740.southamerica-east1.run.app";

interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * Makes a GET request to the Estagionauta API.
 */
export async function apiGet<T = ApiResponse>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} — ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}
