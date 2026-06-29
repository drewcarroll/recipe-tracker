import { z } from 'zod';

/**
 * The single place Supabase environment variables are read and validated.
 * Nothing outside the infrastructure layer should touch `process.env`.
 *
 * Validation is lazy (on first access) and cached, so importing this module
 * never throws at bundle time — only when a config is actually requested on
 * the server.
 */

const publicSchema = z.object({
  url: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  anonKey: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
});

const serverSchema = z.object({
  url: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  serviceRoleKey: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
});

const anthropicSchema = z.object({
  apiKey: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
});

export type PublicSupabaseConfig = z.infer<typeof publicSchema>;
export type ServerSupabaseConfig = z.infer<typeof serverSchema>;
export type AnthropicConfig = z.infer<typeof anthropicSchema>;

let publicConfig: PublicSupabaseConfig | null = null;
let serverConfig: ServerSupabaseConfig | null = null;
let anthropicConfig: AnthropicConfig | null = null;

/** URL + anon key — safe to use in the browser (protected by RLS). */
export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  if (!publicConfig) {
    publicConfig = publicSchema.parse({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  }
  return publicConfig;
}

/**
 * URL + service role key — SERVER ONLY. Never import this into client code;
 * the service role key bypasses Row Level Security.
 */
export function getServerSupabaseConfig(): ServerSupabaseConfig {
  if (!serverConfig) {
    serverConfig = serverSchema.parse({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  }
  return serverConfig;
}

/**
 * Anthropic API key — SERVER ONLY. The "Create using AI" recipe parser runs
 * through a backend route so the key is never exposed to the browser
 * (idea.md §6).
 */
export function getAnthropicConfig(): AnthropicConfig {
  if (!anthropicConfig) {
    anthropicConfig = anthropicSchema.parse({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicConfig;
}
