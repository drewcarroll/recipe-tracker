import type { TypedSupabaseClient } from '@infrastructure/supabase/client';
import type { IngredientRow } from '@infrastructure/supabase/types';

import { assertNoError, assertRecipeOwned, unwrapMany, unwrapSingle } from './internal';

/**
 * CRUD for a recipe's `ingredients` (quantity + unit + name, idea.md §2).
 *
 * Ingredients reference a recipe, not a user, so every operation first asserts
 * the recipe is owned by `username` — that is how these helpers stay scoped by
 * username.
 */

export interface IngredientInput {
  name: string;
  quantity?: string;
  unit?: string;
  position?: number;
}

/** List a recipe's ingredients in display order. */
export async function listIngredients(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
): Promise<IngredientRow[]> {
  await assertRecipeOwned(db, username, recipeId);
  return unwrapMany(
    await db
      .from('ingredients')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('position', { ascending: true }),
  );
}

/** Add an ingredient to a recipe. */
export async function createIngredient(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  input: IngredientInput,
): Promise<IngredientRow> {
  await assertRecipeOwned(db, username, recipeId);
  return unwrapSingle(
    await db
      .from('ingredients')
      .insert({ ...input, recipe_id: recipeId })
      .select('*')
      .single(),
  );
}

/** Update one ingredient of a recipe. */
export async function updateIngredient(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  ingredientId: string,
  patch: Partial<IngredientInput>,
): Promise<IngredientRow> {
  await assertRecipeOwned(db, username, recipeId);
  return unwrapSingle(
    await db
      .from('ingredients')
      .update(patch)
      .eq('id', ingredientId)
      .eq('recipe_id', recipeId)
      .select('*')
      .single(),
  );
}

/** Delete one ingredient of a recipe. */
export async function deleteIngredient(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  ingredientId: string,
): Promise<void> {
  await assertRecipeOwned(db, username, recipeId);
  assertNoError(
    await db.from('ingredients').delete().eq('id', ingredientId).eq('recipe_id', recipeId),
  );
}

/**
 * Replace a recipe's entire ingredient list in one call. Convenient for the
 * editable-list UI (idea.md §2): `position` defaults to array index. Existing
 * rows are removed first, so the result reflects exactly `items`.
 */
export async function replaceIngredients(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  items: IngredientInput[],
): Promise<IngredientRow[]> {
  await assertRecipeOwned(db, username, recipeId);
  assertNoError(await db.from('ingredients').delete().eq('recipe_id', recipeId));
  if (items.length === 0) {
    return [];
  }
  return unwrapMany(
    await db
      .from('ingredients')
      .insert(
        items.map((item, index) => ({
          recipe_id: recipeId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          position: item.position ?? index,
        })),
      )
      .select('*'),
  );
}
