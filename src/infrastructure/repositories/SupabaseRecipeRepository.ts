import type { RecipeRepository } from '@application/ports/RecipeRepository';
import type {
  Ingredient,
  IngredientInput,
  PrepItem,
  PrepItemInput,
  RecipeBasics,
  RecipeDetail,
  RecipeSummary,
  Step,
  StepInput,
} from '@application/types';

import { ingredients, prepItems, recipes, steps } from '@infrastructure/data-access';
import { getServiceRoleClient } from '@infrastructure/supabase/client';
import type {
  IngredientRow,
  PrepItemRow,
  RecipeWithStatsRow,
  StepRow,
} from '@infrastructure/supabase/types';

/** Map a `recipes_with_stats` view row to the application's summary shape. */
function toSummary(row: RecipeWithStatsRow): RecipeSummary {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    username: row.username,
    timesCooked: row.times_cooked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map an ingredient row to the application's `Ingredient`. */
function toIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    position: row.position,
  };
}

/** Map a prep-item row to the application's `PrepItem`. */
function toPrepItem(row: PrepItemRow): PrepItem {
  return { id: row.id, text: row.text, position: row.position };
}

/** Map a step row to the application's `Step`. */
function toStep(row: StepRow): Step {
  return { id: row.id, text: row.text, position: row.position };
}

/**
 * Supabase-backed {@link RecipeRepository}. Uses the service-role client because
 * authorization is enforced in code (every query is scoped by username) rather
 * than by RLS while auth is lightweight (idea.md §0).
 */
export class SupabaseRecipeRepository implements RecipeRepository {
  async listSummaries(username: string): Promise<RecipeSummary[]> {
    const rows = await recipes.listRecipesWithStats(getServiceRoleClient(), username);
    return rows.map(toSummary);
  }

  async create(username: string, basics: RecipeBasics): Promise<RecipeSummary> {
    const row = await recipes.createRecipe(getServiceRoleClient(), username, basics);
    // A brand-new recipe has no cook sessions yet, so Times cooked starts at 0.
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      username: row.username,
      timesCooked: 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateBasics(username: string, recipeId: string, basics: RecipeBasics): Promise<void> {
    await recipes.updateRecipe(getServiceRoleClient(), username, recipeId, basics);
  }

  async delete(username: string, recipeId: string): Promise<void> {
    await recipes.deleteRecipe(getServiceRoleClient(), username, recipeId);
  }

  async getDetail(username: string, recipeId: string): Promise<RecipeDetail | null> {
    const db = getServiceRoleClient();
    const recipe = await recipes.getRecipe(db, username, recipeId);
    if (!recipe) {
      return null;
    }
    const [ingredientRows, prepRows, stepRows] = await Promise.all([
      ingredients.listIngredients(db, username, recipeId),
      prepItems.listPrepItems(db, username, recipeId),
      steps.listSteps(db, username, recipeId),
    ]);
    return {
      id: recipe.id,
      name: recipe.name,
      color: recipe.color,
      icon: recipe.icon,
      username: recipe.username,
      ingredients: ingredientRows.map(toIngredient),
      prep: prepRows.map(toPrepItem),
      steps: stepRows.map(toStep),
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    };
  }

  async replaceIngredients(
    username: string,
    recipeId: string,
    items: IngredientInput[],
  ): Promise<Ingredient[]> {
    const rows = await ingredients.replaceIngredients(
      getServiceRoleClient(),
      username,
      recipeId,
      items,
    );
    return rows.map(toIngredient).sort((a, b) => a.position - b.position);
  }

  async replacePrep(
    username: string,
    recipeId: string,
    items: PrepItemInput[],
  ): Promise<PrepItem[]> {
    const rows = await prepItems.replacePrepItems(
      getServiceRoleClient(),
      username,
      recipeId,
      items,
    );
    return rows.map(toPrepItem).sort((a, b) => a.position - b.position);
  }

  async replaceSteps(username: string, recipeId: string, items: StepInput[]): Promise<Step[]> {
    const rows = await steps.replaceSteps(getServiceRoleClient(), username, recipeId, items);
    return rows.map(toStep).sort((a, b) => a.position - b.position);
  }
}
