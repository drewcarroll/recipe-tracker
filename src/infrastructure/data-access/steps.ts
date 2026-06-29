import type { TypedSupabaseClient } from '@infrastructure/supabase/client';
import type { StepRow } from '@infrastructure/supabase/types';

import { assertNoError, assertRecipeOwned, unwrapMany, unwrapSingle } from './internal';

/**
 * CRUD for a recipe's `steps` — sequential cook steps (idea.md §2). Scoped by
 * username via the recipe-ownership check.
 */

export interface StepInput {
  text: string;
  position?: number;
}

/** List a recipe's steps in order. */
export async function listSteps(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
): Promise<StepRow[]> {
  await assertRecipeOwned(db, username, recipeId);
  return unwrapMany(
    await db
      .from('steps')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('position', { ascending: true }),
  );
}

/** Add a step to a recipe. */
export async function createStep(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  input: StepInput,
): Promise<StepRow> {
  await assertRecipeOwned(db, username, recipeId);
  return unwrapSingle(
    await db
      .from('steps')
      .insert({ ...input, recipe_id: recipeId })
      .select('*')
      .single(),
  );
}

/** Update one step of a recipe. */
export async function updateStep(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  stepId: string,
  patch: Partial<StepInput>,
): Promise<StepRow> {
  await assertRecipeOwned(db, username, recipeId);
  return unwrapSingle(
    await db
      .from('steps')
      .update(patch)
      .eq('id', stepId)
      .eq('recipe_id', recipeId)
      .select('*')
      .single(),
  );
}

/** Delete one step of a recipe. */
export async function deleteStep(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  stepId: string,
): Promise<void> {
  await assertRecipeOwned(db, username, recipeId);
  assertNoError(await db.from('steps').delete().eq('id', stepId).eq('recipe_id', recipeId));
}

/**
 * Replace a recipe's entire step list in one call (add/edit/reorder UI).
 * `position` defaults to array index.
 */
export async function replaceSteps(
  db: TypedSupabaseClient,
  username: string,
  recipeId: string,
  items: StepInput[],
): Promise<StepRow[]> {
  await assertRecipeOwned(db, username, recipeId);
  assertNoError(await db.from('steps').delete().eq('recipe_id', recipeId));
  if (items.length === 0) {
    return [];
  }
  return unwrapMany(
    await db
      .from('steps')
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
