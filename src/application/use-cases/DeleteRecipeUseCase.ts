import type { RecipeRepository } from '@application/ports/RecipeRepository';
import { usernameSchema } from '@application/types';

/**
 * Delete a recipe (idea.md §2). The recipe's ingredients, prep, and steps are
 * removed with it; past cook sessions are independent snapshots and are not
 * affected (idea.md §4).
 */
export class DeleteRecipeUseCase {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(rawUsername: string, recipeId: string): Promise<void> {
    const username = usernameSchema.parse(rawUsername.trim());
    await this.recipes.delete(username, recipeId);
  }
}
