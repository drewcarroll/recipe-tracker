import type { RecipeDetail, RecipeSuggestion } from '@application/types';

/**
 * Port describing how free-text post-cook notes are turned into a list of
 * suggested recipe changes (idea.md §3, "Notes for next time"), without knowing
 * which LLM does it. Distinct from {@link RecipeParser}: that turns pasted text
 * into a brand-new recipe, whereas this proposes edits to an *existing* recipe.
 *
 * Infrastructure provides the implementation (a Claude-backed interpreter); use
 * cases depend only on this interface (Clean Architecture dependency rule).
 */
export interface CookNotesInterpreter {
  /**
   * Given the current recipe (with stable item ids) and the cook's notes,
   * return discrete, independently-approvable suggested changes. Implementations
   * validate the result, so callers receive well-formed {@link RecipeSuggestion}
   * values (possibly empty) or an error.
   */
  suggest(recipe: RecipeDetail, notes: string): Promise<RecipeSuggestion[]>;
}
