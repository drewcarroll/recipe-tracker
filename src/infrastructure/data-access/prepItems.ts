import type { TypedSupabaseClient } from '@infrastructure/supabase/client';
import type { PrepItemRow } from '@infrastructure/supabase/types';

import { assertNoError, assertRecipeOwned, unwrapMany, unwrapSingle } from './internal';

/**
 * CRUD for a recipe's `prep_items` — standalone tasks done before the cook
 * (idea.md §2). Scoped by username via the recipe-ownership check.
 */

export interface PrepItemInput {
  text: string;
  position?: number;
}

/** List a recipe's prep items in order. */
export async function listPrepItems(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
): Promise<PrepItemRow[]> {
  await assertRecipeOwned(db, username, recipeId);
  return unwrapMany(
    await db
      .from('prep_items')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('position', { ascending: true }),
  );
}

/** Add a prep item to a recipe. */
export async function createPrepItem(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  input: PrepItemInput,
): Promise<PrepItemRow> {
  await assertRecipeOwned(db, username, recipeId);
  return unwrapSingle(
    await db
      .from('prep_items')
      .insert({ ...input, recipe_id: recipeId })
      .select('*')
      .single(),
  );
}

/** Update one prep item of a recipe. */
export async function updatePrepItem(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  prepItemId: string,
  patch: Partial<PrepItemInput>,
): Promise<PrepItemRow> {
  await assertRecipeOwned(db, username, recipeId);
  return unwrapSingle(
    await db
      .from('prep_items')
      .update(patch)
      .eq('id', prepItemId)
      .eq('recipe_id', recipeId)
      .select('*')
      .single(),
  );
}

/** Delete one prep item of a recipe. */
export async function deletePrepItem(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  prepItemId: string,
): Promise<void> {
  await assertRecipeOwned(db, username, recipeId);
  assertNoError(
    await db.from('prep_items').delete().eq('id', prepItemId).eq('recipe_id', recipeId),
  );
}

/**
 * Replace a recipe's entire prep list in one call (editable-list UI).
 * `position` defaults to array index.
 */
export async function replacePrepItems(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  items: PrepItemInput[],
): Promise<PrepItemRow[]> {
  await assertRecipeOwned(db, username, recipeId);
  assertNoError(await db.from('prep_items').delete().eq('recipe_id', recipeId));
  if (items.length === 0) {
    return [];
  }
  return unwrapMany(
    await db
      .from('prep_items')
      .insert(
        items.map((item, index) => ({
          recipe_id: recipeId,
          text: item.text,
          position: item.position ?? index,
        })),
      )
      .select('*'),
  );
}
