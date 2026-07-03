/**
 * Safely resolves the API URL across different environments (Node, Cloudflare Workers, etc.)
 */
function getApiUrl(): string {
  try {
    if (typeof process !== "undefined" && process.env && process.env.ESTAGIONAUTA_API_URL) {
      return process.env.ESTAGIONAUTA_API_URL;
    }
  } catch {
    // Ignore ReferenceErrors in strict environments
  }

  try {
    if (typeof globalThis !== "undefined" && (globalThis as any).ESTAGIONAUTA_API_URL) {
      return (globalThis as any).ESTAGIONAUTA_API_URL;
    }
  } catch {
    // Ignore
  }

  return "https://estagionauta-api-991344207740.southamerica-east1.run.app";
}

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
  const apiUrl = getApiUrl();
  const url = new URL(`${apiUrl}${path}`);

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
  const apiUrl = getApiUrl();
  const url = new URL(`${apiUrl}${path}`);

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

