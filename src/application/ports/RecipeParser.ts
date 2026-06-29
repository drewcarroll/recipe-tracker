import type { StructuredRecipe } from '@application/types';

/**
 * Port describing how raw, pasted recipe text is turned into a structured
 * recipe (idea.md §2, "Create using AI"), without knowing which LLM does it.
 * Infrastructure provides the implementation (a Claude-backed parser); use
 * cases depend only on this interface (Clean Architecture dependency rule).
 */
export interface RecipeParser {
  /**
   * Parse free-form pasted text into a structured recipe — name, ingredients
   * (quantity + unit + name), prep, and steps. Implementations validate the
   * result, so callers receive a well-formed {@link StructuredRecipe} or an
   * error.
   */
  parse(text: string): Promise<StructuredRecipe>;
}
