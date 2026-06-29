import type { RecipeRepository } from '@application/ports/RecipeRepository';
import { recipeBasicsSchema, usernameSchema } from '@application/types';

/**
 * Edit a recipe's basic info (idea.md §2): name, color, icon. Validates and
 * normalises the raw input before touching the repository.
 */
export class UpdateRecipeUseCase {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(rawUsername: string, recipeId: string, rawBasics: unknown): Promise<void> {
    const username = usernameSchema.parse(rawUsername.trim());
    const basics = recipeBasicsSchema.parse(rawBasics);
    await this.recipes.updateBasics(username, recipeId, basics);
  }
}
