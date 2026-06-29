import type { PostgrestError } from '@supabase/supabase-js';

import type { TypedSupabaseClient } from '@infrastructure/supabase/client';

/** Raised when a Supabase query fails or an ownership check is violated. */
export class DataAccessError extends Error {
  public override readonly cause?: PostgrestError;

  constructor(message: string, cause?: PostgrestError) {
    super(message);
    this.name = 'DataAccessError';
    this.cause = cause;
  }
}

/** Thrown when a row is requested under a username that does not own it. */
export class NotFoundError extends DataAccessError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Unwrap a Supabase single-row response, throwing on error or null. */
export function unwrapSingle<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) {
    throw new DataAccessError(result.error.message, result.error);
  }
  if (result.data === null) {
    throw new NotFoundError('Row not found');
  }
  return result.data;
}

/** Unwrap a Supabase multi-row response, throwing on error. */
export function unwrapMany<T>(result: { data: T[] | null; error: PostgrestError | null }): T[] {
  if (result.error) {
    throw new DataAccessError(result.error.message, result.error);
  }
  return result.data ?? [];
}

/** Throw if a Supabase write/delete returned an error. */
export function assertNoError(result: { error: PostgrestError | null }): void {
  if (result.error) {
    throw new DataAccessError(result.error.message, result.error);
  }
}

/**
 * Verify a recipe exists AND is owned by `username`. Used by child-entity
 * helpers (ingredients / prep / steps) so every write is scoped by username
 * even though the child rows reference the recipe, not the user directly.
 *
 * Throws {@link NotFoundError} if the recipe does not exist or belongs to
 * another user.
 */
export async function assertRecipeOwned(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
): Promise<void> {
  const { data, error } = await db
    .from('recipes')
    .select('id')
    .eq('id', recipeId)
    .eq('username', username)
    .maybeSingle();

  if (error) {
    throw new DataAccessError(error.message, error);
  }
  if (!data) {
    throw new NotFoundError(`Recipe ${recipeId} not found for user ${username}`);
  }
}
