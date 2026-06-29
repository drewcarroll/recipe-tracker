import type { RecipeRepository } from '@application/ports/RecipeRepository';
import { usernameSchema, type RecipeSummary } from '@application/types';

/**
 * Load the "Your Recipes" list for a user (idea.md §2): their recipe cards plus
 * each one's derived "Times cooked" count. Validates and normalises the raw
 * username before touching the repository, so callers (HTTP routes, etc.) only
 * have to hand over the untrusted string.
 */
export class ListRecipesUseCase {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(rawUsername: string): Promise<RecipeSummary[]> {
    const username = usernameSchema.parse(rawUsername.trim());
    return this.recipes.listSummaries(username);
  }
}
