import type { RecipeSummary } from '@application/types';

/**
 * Port describing how the application reads/persists recipes, without knowing
 * which database backs it. Infrastructure provides the implementation; use
 * cases depend only on this interface (Clean Architecture dependency rule).
 */
export interface RecipeRepository {
  /**
   * List a user's recipes as lightweight summaries for the "Your Recipes" list
   * (idea.md §2), each carrying its derived "Times cooked" count. Newest first.
   */
  listSummaries(username: string): Promise<RecipeSummary[]>;
}
