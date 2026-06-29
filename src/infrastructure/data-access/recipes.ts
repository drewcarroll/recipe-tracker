import type { TypedSupabaseClient } from '@infrastructure/supabase/client';
import type { RecipeRow, RecipeWithStatsRow } from '@infrastructure/supabase/types';

import { assertNoError, DataAccessError, unwrapMany, unwrapSingle } from './internal';

/**
 * CRUD for `recipes`, every operation scoped by `username` so a user can only
 * ever read or mutate their own recipes.
 */

export interface CreateRecipeInput {
  name: string;
  color: string;
  icon: string;
}

export type UpdateRecipeInput = Partial<CreateRecipeInput>;

/** Create a recipe owned by `username`. */
export async function createRecipe(
  db: TypedSupabaseClient,
  username: string,
  input: CreateRecipeInput,
): Promise<RecipeRow> {
  return unwrapSingle(
    await db
      .from('recipes')
      .insert({ ...input, username })
      .select('*')
      .single(),
  );
}

/** List a user's recipes, newest first. */
export async function listRecipes(db: TypedSupabaseClient, username: string): Promise<RecipeRow[]> {
  return unwrapMany(
    await db
      .from('recipes')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false }),
  );
}

/**
 * List a user's recipes together with their derived "Times cooked" count
 * (idea.md §2), read from the `recipes_with_stats` view.
 */
export async function listRecipesWithStats(
  db: TypedSupabaseClient,
  username: string,
): Promise<RecipeWithStatsRow[]> {
  return unwrapMany(
    await db
      .from('recipes_with_stats')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false }),
  );
}

/** Fetch a single recipe owned by `username`, or null if not found. */
export async function getRecipe(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
): Promise<RecipeRow | null> {
  const { data, error } = await db
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .eq('username', username)
    .maybeSingle();

  if (error) {
    throw new DataAccessError(error.message, error);
  }
  return data;
}

/** Update a recipe owned by `username`. Bumps `updated_at`. */
export async function updateRecipe(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  patch: UpdateRecipeInput,
): Promise<RecipeRow> {
  return unwrapSingle(
    await db
      .from('recipes')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', recipeId)
      .eq('username', username)
      .select('*')
      .single(),
  );
}

/** Delete a recipe owned by `username`. Cascades to its children. */
export async function deleteRecipe(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
): Promise<void> {
  assertNoError(await db.from('recipes').delete().eq('id', recipeId).eq('username', username));
}
