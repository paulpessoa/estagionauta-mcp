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
  params?: Record<string, string>,
  token?: string
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} — ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Makes a POST request to the Estagionauta API.
 */
export async function apiPost<T = ApiResponse>(
  path: string,
  body?: Record<string, unknown>,
  token?: string
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} — ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

