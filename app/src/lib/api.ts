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
/** Bumped whenever the signed-in account changes. */
let authGeneration = 0;

/**
 * Must be called on sign-out and sign-in: a refresh started by the previous
 * account can still be in flight, and its tokens must never land in the
 * keychain under the next one.
 */
export function resetAuthState() {
  refreshing = null;
  authGeneration += 1;
}

async function refreshTokens(): Promise<AuthTokens | null> {
  const current = await tokenStore.get();
  if (!current) return null;
  // Captured after the read so the generation and the token it refreshes belong
  // to the same session — reading the keychain is itself an await.
  const generation = authGeneration;

  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  });

  // Signed out (or into another account) while this was in flight — this result
  // belongs to a session that no longer exists, so it must neither store tokens
  // nor clear the ones the current session just wrote.
  if (generation !== authGeneration) return null;

  if (!res.ok) {
    await tokenStore.clear();
    return null;
  }
  const data = (await res.json()) as { tokens: AuthTokens };
  // Re-checked because reading the body suspends: the account can change
  // between the check above and this write.
  if (generation !== authGeneration) return null;
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
    // Coalesce concurrent refreshes into a single request. `resetAuthState` can
    // null the slot while a refresh is still pending, so only the promise that
    // currently owns the slot may clear it — otherwise a stale refresh settling
    // late would evict a live one and let a second refresh reuse the same token.
    if (!refreshing) {
      const pending: Promise<AuthTokens | null> = refreshTokens().finally(() => {
        if (refreshing === pending) refreshing = null;
      });
      refreshing = pending;
    }
    tokens = await refreshing;
    if (tokens) res = await doFetch(tokens.accessToken);
  }

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (payload as { error?: string }).error ?? 'Request failed',
      payload,
    );
  }
  return payload as T;
}
