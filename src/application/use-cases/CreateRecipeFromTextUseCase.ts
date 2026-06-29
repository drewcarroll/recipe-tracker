import { z } from 'zod';

import type { RecipeParser } from '@application/ports/RecipeParser';
import type { RecipeRepository } from '@application/ports/RecipeRepository';
import { recipeBasicsSchema, usernameSchema, type RecipeSummary } from '@application/types';

/** Cap on pasted text so a single request can't blow past the model's context. */
const MAX_TEXT_LENGTH = 20000;

const pastedTextSchema = z.string().trim().min(1).max(MAX_TEXT_LENGTH);

/**
 * "Create using AI" (idea.md §2): take pasted recipe text, have Claude parse it
 * into a structured recipe, and save it directly as a new recipe the user can
 * then edit. Color and icon aren't inferred — the caller supplies sensible
 * defaults and the user changes them later on the detail page.
 */
export class CreateRecipeFromTextUseCase {
  constructor(
    private readonly parser: RecipeParser,
    private readonly recipes: RecipeRepository,
  ) {}

  async execute(rawUsername: string, rawText: string, rawBasics: unknown): Promise<RecipeSummary> {
    const username = usernameSchema.parse(rawUsername.trim());
    const text = pastedTextSchema.parse(rawText);
    // Only color + icon come from the caller; the name comes from the parse.
    const { color, icon } = recipeBasicsSchema.omit({ name: true }).parse(rawBasics);

    const structured = await this.parser.parse(text);

    const summary = await this.recipes.create(username, {
      name: structured.name,
      color,
      icon,
    });

    // Persist the parsed contents into the new recipe's sections.
    await Promise.all([
      this.recipes.replaceIngredients(username, summary.id, structured.ingredients),
      this.recipes.replacePrep(
        username,
        summary.id,
        structured.prep.map((text) => ({ text })),
      ),
      this.recipes.replaceSteps(
        username,
        summary.id,
        structured.steps.map((text) => ({ text })),
      ),
    ]);

    return summary;
  }
}
