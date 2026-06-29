import type { RecipeRepository } from '@application/ports/RecipeRepository';
import { recipeBasicsSchema, usernameSchema, type RecipeSummary } from '@application/types';

/**
 * Create a blank recipe from its basic info (idea.md §2): name, color, icon.
 * The recipe starts with no ingredients/prep/steps — the user fills those in
 * on the detail/editor page afterwards. Validates and normalises the raw input
 * before touching the repository.
 */
export class CreateRecipeUseCase {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(rawUsername: string, rawBasics: unknown): Promise<RecipeSummary> {
    const username = usernameSchema.parse(rawUsername.trim());
    const basics = recipeBasicsSchema.parse(rawBasics);
    return this.recipes.create(username, basics);
  }
}
