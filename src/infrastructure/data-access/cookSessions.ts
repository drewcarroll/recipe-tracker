import type { TypedSupabaseClient } from '@infrastructure/supabase/client';
import type { CookSessionRow, RecipeSnapshot } from '@infrastructure/supabase/types';

import { assertNoError, DataAccessError, unwrapSingle } from './internal';

/**
 * Read/create/delete for `cook_sessions`, scoped by username.
 *
 * Sessions are an IMMUTABLE record of one cook (idea.md §4): the snapshot is
 * frozen at create time and never updated, so there is intentionally no update
 * helper. `recipeId` is optional — a session can outlive the recipe it came
 * from — but `recipeName` and `snapshot` always preserve what was cooked.
 */

export interface CreateCookSessionInput {
  /** Originating recipe, if it still exists. */
  recipeId?: string | null;
  /** Recipe name frozen at cook time. */
  recipeName: string;
  /** Full recipe contents as-at-cook-time. */
  snapshot: RecipeSnapshot;
  /** Things done differently during the cook. */
  deviations?: string[];
  /** Free-text "notes for next time". */
  notes?: string;
  /** How long the cook took, in seconds. */
  durationSeconds?: number;
  /** When the cook happened (defaults to now in the DB). */
  cookedAt?: string;
}

/** Record a completed cook session for `username`. */
export async function createCookSession(
  db: TypedSupabaseClient,
  username: string,
  input: CreateCookSessionInput,
): Promise<CookSessionRow> {
  return unwrapSingle(
    await db
      .from('cook_sessions')
      .insert({
        username,
        recipe_id: input.recipeId ?? null,
        recipe_name: input.recipeName,
        snapshot: input.snapshot,
        deviations: input.deviations,
        notes: input.notes,
        duration_seconds: input.durationSeconds,
        cooked_at: input.cookedAt,
      })
      .select('*')
      .single(),
  );
}

/** List a user's cook sessions, most recent first (the History log). */
export async function listCookSessions(
  db: TypedSupabaseClient,
  username: string,
): Promise<CookSessionRow[]> {
  const { data, error } = await db
    .from('cook_sessions')
    .select('*')
    .eq('username', username)
    .order('cooked_at', { ascending: false });

  if (error) {
    throw new DataAccessError(error.message, error);
  }
  return data ?? [];
}

/** Fetch one of a user's cook sessions, or null if not found. */
export async function getCookSession(
  db: TypedSupabaseClient,
  username: string,
  sessionId: string,
): Promise<CookSessionRow | null> {
  const { data, error } = await db
    .from('cook_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('username', username)
    .maybeSingle();

  if (error) {
    throw new DataAccessError(error.message, error);
  }
  return data;
}

/** Delete one of a user's cook sessions (idea.md §4). */
export async function deleteCookSession(
  db: TypedSupabaseClient,
  username: string,
  sessionId: string,
): Promise<void> {
  assertNoError(
    await db.from('cook_sessions').delete().eq('id', sessionId).eq('username', username),
  );
}
