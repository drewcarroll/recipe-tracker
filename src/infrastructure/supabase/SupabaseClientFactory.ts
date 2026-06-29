import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { Database } from './types';

/**
 * Factory for Supabase clients. The service-role client is for trusted
 * server-side operations only and must never be exposed to the browser.
 */
export class SupabaseClientFactory {
  private static serverClient: SupabaseClient<Database> | null = null;

  /** Server-side admin client (bypasses RLS — server only). */
  static getServerClient(): SupabaseClient<Database> {
    if (!this.serverClient) {
      this.serverClient = createClient<Database>(
        env.supabaseUrl(),
        env.supabaseServiceRoleKey(),
        {
          auth: { persistSession: false, autoRefreshToken: false },
        },
      );
    }
    return this.serverClient;
  }

  /** Anon client (subject to Row Level Security). */
  static createAnonClient(): SupabaseClient<Database> {
    return createClient<Database>(env.supabaseUrl(), env.supabaseAnonKey(), {
      auth: { persistSession: false },
    });
  }
}
