import { API_URL, REQUEST_TIMEOUT_MS } from '@/lib/config';

/** A failed request, with a message that's fine to show the user. */
export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status, or 0 when the server couldn't be reached */
    readonly status: number,
    /** Laravel validation errors, e.g. `{ login: ['These credentials…'] }` */
    readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

/** The first readable message from a Laravel error response. */
function messageFrom(status: number, json: any): string {
  const firstError = json?.errors && Object.values(json.errors as Record<string, string[]>)[0]?.[0];
  if (firstError) return firstError;
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (status >= 500) return 'Something went wrong on our side. Please try again shortly.';
  return json?.message || 'Something went wrong. Please try again.';
}

/** JSON request to the D-Liora API. Throws {@link ApiError}. */
export async function api<T>(path: string, { method = 'GET', body, token }: Options = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach D-Liora. Check your connection and try again.", 0);
  } finally {
    clearTimeout(timer);
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(messageFrom(response.status, json), response.status, json?.errors ?? {});
  }

  return json as T;
}
