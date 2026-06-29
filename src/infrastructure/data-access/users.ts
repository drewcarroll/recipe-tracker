import type { TypedSupabaseClient } from '@infrastructure/supabase/client';
import type { UserRow } from '@infrastructure/supabase/types';

import { assertNoError, DataAccessError, unwrapSingle } from './internal';

/**
 * CRUD for the lightweight `users` table. A user is just a username for now
 * (idea.md §0); `auth_user_id` is reserved for the future Supabase Auth
 * migration.
 */

/** Fetch a user by username, or null if they don't exist yet. */
export async function getUser(db: TypedSupabaseClient, username: string): Promise<UserRow | null> {
  const { data, error } = await db.from('users').select('*').eq('username', username).maybeSingle();

  if (error) {
    throw new DataAccessError(error.message, error);
  }
  return data;
}

/**
 * "Log in": return the existing user or create them on first sight. Idempotent
 * so the username-only login flow can call it freely.
 */
export async function ensureUser(db: TypedSupabaseClient, username: string): Promise<UserRow> {
  return unwrapSingle(
    await db.from('users').upsert({ username }, { onConflict: 'username' }).select('*').single(),
  );
}

/** Delete a user. Cascades to their recipes (and children) per the schema. */
export async function deleteUser(db: TypedSupabaseClient, username: string): Promise<void> {
  assertNoError(await db.from('users').delete().eq('username', username));
}
