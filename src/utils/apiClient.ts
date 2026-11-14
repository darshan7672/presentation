/**
 * CarbonX Client API Helper with rate limit error handling (HTTP 429)
 */

export interface ApiError {
  error: string;
  message?: string;
  retryAfterSeconds?: number;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (response.status === 429) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please wait before retrying.",
    }));

    const retryAfter = response.headers.get("Retry-After") || errorData.retryAfterSeconds || 60;
    throw new Error(errorData.message || `Rate limit exceeded. Try again in ${retryAfter} seconds.`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || errorData.message || "API request failed");
  }

  return response.json();
}
