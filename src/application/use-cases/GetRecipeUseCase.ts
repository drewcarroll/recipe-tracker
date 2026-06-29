import type { RecipeRepository } from '@application/ports/RecipeRepository';
import { usernameSchema, type RecipeDetail } from '@application/types';

/**
 * Load one recipe with its ingredients, prep, and steps for the detail/editor
 * page (idea.md §2). Returns null when the recipe does not belong to the user.
 */
export class GetRecipeUseCase {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(rawUsername: string, recipeId: string): Promise<RecipeDetail | null> {
    const username = usernameSchema.parse(rawUsername.trim());
    return this.recipes.getDetail(username, recipeId);
  }
}
