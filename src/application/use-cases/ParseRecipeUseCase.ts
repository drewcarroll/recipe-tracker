import type { RecipeParser } from '@application/ports/RecipeParser';
import { pastedRecipeTextSchema, type StructuredRecipe } from '@application/types';

/**
 * Parse pasted recipe text into a structured recipe (idea.md §2) — the reusable
 * backend primitive behind "Create using AI". Validates the raw text, delegates
 * to the {@link RecipeParser} (which calls Claude and validates the result
 * against the shared schema), and returns the structured recipe without
 * persisting anything. Persistence is a separate concern (CreateRecipeFromText).
 */
export class ParseRecipeUseCase {
  constructor(private readonly parser: RecipeParser) {}

  async execute(rawText: string): Promise<StructuredRecipe> {
    const text = pastedRecipeTextSchema.parse(rawText);
    return this.parser.parse(text);
  }
}
