import type { AuthTokens } from '@gymcrush/shared';
import { API_URL } from './config';
import { tokenStore } from './tokenStore';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean; // attach access token (default true)
}

let refreshing: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  const current = await tokenStore.get();
  if (!current) return null;

  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  });

  if (!res.ok) {
    await tokenStore.clear();
    return null;
  }
  const data = (await res.json()) as { tokens: AuthTokens };
  await tokenStore.set(data.tokens);
  return data.tokens;
}

/**
 * Thin fetch wrapper: JSON in/out, bearer auth, and one transparent retry after
 * refreshing an expired access token.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const doFetch = async (accessToken?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let tokens = auth ? await tokenStore.get() : null;
  let res = await doFetch(tokens?.accessToken);

  if (res.status === 401 && auth) {
    // Coalesce concurrent refreshes into a single request.
    refreshing ??= refreshTokens().finally(() => {
      refreshing = null;
    });
    tokens = await refreshing;
    if (tokens) res = await doFetch(tokens.accessToken);
  }

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (payload as { error?: string }).error ?? 'Request failed', payload);
  }
  return payload as T;
}
