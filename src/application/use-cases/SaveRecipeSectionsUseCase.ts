import type { RecipeRepository } from '@application/ports/RecipeRepository';
import {
  ingredientInputSchema,
  prepItemInputSchema,
  stepInputSchema,
  usernameSchema,
  type Ingredient,
  type PrepItem,
  type Step,
} from '@application/types';
import { z } from 'zod';

/**
 * Persist the editable Ingredients / Prep / Steps sections (idea.md §2).
 *
 * Each section is saved as a whole, ordered list (the array index becomes the
 * stored `position`, so reordering on the client is preserved). Raw input is
 * validated here before it reaches the repository, so the HTTP routes only have
 * to hand over the parsed JSON arrays.
 */
export class SaveRecipeSectionsUseCase {
  constructor(private readonly recipes: RecipeRepository) {}

  async saveIngredients(
    rawUsername: string,
    recipeId: string,
    rawItems: unknown,
  ): Promise<Ingredient[]> {
    const username = usernameSchema.parse(rawUsername.trim());
    const items = z.array(ingredientInputSchema).parse(rawItems);
    return this.recipes.replaceIngredients(username, recipeId, items);
  }

  async savePrep(rawUsername: string, recipeId: string, rawItems: unknown): Promise<PrepItem[]> {
    const username = usernameSchema.parse(rawUsername.trim());
    const items = z.array(prepItemInputSchema).parse(rawItems);
    return this.recipes.replacePrep(username, recipeId, items);
  }

  async saveSteps(rawUsername: string, recipeId: string, rawItems: unknown): Promise<Step[]> {
    const username = usernameSchema.parse(rawUsername.trim());
    const items = z.array(stepInputSchema).parse(rawItems);
    return this.recipes.replaceSteps(username, recipeId, items);
  }
}
