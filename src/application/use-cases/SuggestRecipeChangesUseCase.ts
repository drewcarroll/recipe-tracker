import type { CookNotesInterpreter } from '@application/ports/CookNotesInterpreter';
import type { RecipeRepository } from '@application/ports/RecipeRepository';
import {
  cookNotesSchema,
  usernameSchema,
  type RecipeDetail,
  type RecipeSuggestion,
} from '@application/types';

/**
 * "Notes for next time" → suggested changes (idea.md §3). Loads the recipe the
 * notes are about (which also enforces ownership), hands it plus the notes to
 * the {@link CookNotesInterpreter}, and returns the proposed changes for the
 * user to Approve/Reject. Nothing is persisted here — applying an approved
 * suggestion is a separate use case (ApplyRecipeSuggestion).
 *
 * Returns null when the recipe doesn't exist for the user (the route maps that
 * to a 404), mirroring {@link GetRecipeUseCase}.
 */
export class SuggestRecipeChangesUseCase {
  constructor(
    private readonly recipes: RecipeRepository,
    private readonly interpreter: CookNotesInterpreter,
  ) {}

  async execute(
    rawUsername: string,
    recipeId: string,
    rawNotes: string,
  ): Promise<RecipeSuggestion[] | null> {
    const username = usernameSchema.parse(rawUsername.trim());
    const notes = cookNotesSchema.parse(rawNotes);

    const recipe = await this.recipes.getDetail(username, recipeId);
    if (!recipe) {
      return null;
    }

    const suggestions = await this.interpreter.suggest(recipe, notes);

    // Drop suggestions that target an item id the recipe doesn't have (a model
    // can occasionally invent one). Add/rename suggestions carry no target id.
    return suggestions.filter((suggestion) => targetExists(suggestion, recipe));
  }
}

/** True unless a suggestion references an item id absent from the recipe. */
function targetExists(suggestion: RecipeSuggestion, recipe: RecipeDetail): boolean {
  switch (suggestion.kind) {
    case 'update-ingredient':
    case 'remove-ingredient':
      return recipe.ingredients.some((item) => item.id === suggestion.ingredientId);
    case 'update-prep':
    case 'remove-prep':
      return recipe.prep.some((item) => item.id === suggestion.prepId);
    case 'update-step':
    case 'remove-step':
      return recipe.steps.some((item) => item.id === suggestion.stepId);
    default:
      return true;
  }
}
