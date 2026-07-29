import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

/**
 * Service-role Supabase client. **Server-only** — this key bypasses row security
 * entirely, so it must never be prefixed `EXPO_PUBLIC_` or land in app/eas.json
 * (Expo inlines those into the JS bundle, which is trivially extractable).
 *
 * Built lazily so the API still boots when the key isn't configured yet; only the
 * routes that genuinely need admin powers fail, and they fail loudly.
 */
let client: SupabaseClient | null = null;

export const supabaseAdminConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

export function supabaseAdmin(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase admin client requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. See backend/.env.example',
    );
  }
  client ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
