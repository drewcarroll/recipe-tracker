import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getServerSupabaseConfig } from '@infrastructure/config/env';

import type { Database } from './types';

/** A Supabase client fully typed against our database schema. */
export type TypedSupabaseClient = SupabaseClient<Database>;

let cachedServiceClient: TypedSupabaseClient | null = null;

/**
 * Create a SERVER-ONLY Supabase client using the service role key.
 *
 * The service role bypasses Row Level Security, so this must never run in the
 * browser. The data-access layer uses it because, with lightweight username
 * auth (idea.md §0), authorization is enforced in code (every helper is scoped
 * by username) rather than by RLS.
 */
export function createServiceRoleClient(): TypedSupabaseClient {
  const { url, serviceRoleKey } = getServerSupabaseConfig();
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Lazily-created, cached service-role client for reuse across requests. */
export function getServiceRoleClient(): TypedSupabaseClient {
  if (!cachedServiceClient) {
    cachedServiceClient = createServiceRoleClient();
  }
  return cachedServiceClient;
}
