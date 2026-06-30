import type { RecipeRepository } from '@application/ports/RecipeRepository';
import {
  recipeSuggestionSchema,
  usernameSchema,
  type IngredientInput,
  type PrepItemInput,
  type RecipeDetail,
  type RecipeSuggestion,
  type StepInput,
} from '@application/types';

/**
 * Apply a single approved "notes for next time" suggestion directly to the live
 * recipe (idea.md §3). The change logic lives here — the route only validates
 * the envelope and delegates — so the dependency rule holds (no business logic
 * in the interface layer).
 *
 * Each suggestion is folded into the current recipe and the affected section is
 * re-saved as a whole (matching the section-replace persistence model). The
 * recipe is loaded fresh on every call, so applying several approved
 * suggestions in sequence always builds on the previous result, and a
 * suggestion whose target item no longer exists is a safe no-op.
 *
 * Returns the updated recipe, or null when it doesn't exist for the user (the
 * route maps that to a 404).
 */
export class ApplyRecipeSuggestionUseCase {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(
    rawUsername: string,
    recipeId: string,
    rawSuggestion: unknown,
  ): Promise<RecipeDetail | null> {
    const username = usernameSchema.parse(rawUsername.trim());
    const suggestion = recipeSuggestionSchema.parse(rawSuggestion);

    const recipe = await this.recipes.getDetail(username, recipeId);
    if (!recipe) {
      return null;
    }

    await this.applyOne(username, recipe, suggestion);

    // Return the recipe as it now stands so the caller can keep applying
    // further suggestions against up-to-date contents.
    return this.recipes.getDetail(username, recipeId);
  }

  private async applyOne(
    username: string,
    recipe: RecipeDetail,
    suggestion: RecipeSuggestion,
  ): Promise<void> {
    switch (suggestion.kind) {
      case 'rename':
        await this.recipes.updateBasics(username, recipe.id, {
          name: suggestion.name,
          color: recipe.color,
          icon: recipe.icon,
        });
        return;

      case 'add-ingredient':
        await this.recipes.replaceIngredients(username, recipe.id, [
          ...toIngredientInputs(recipe),
          suggestion.ingredient,
        ]);
        return;

      case 'update-ingredient':
        await this.recipes.replaceIngredients(
          username,
          recipe.id,
          recipe.ingredients.map((item) =>
            item.id === suggestion.ingredientId
              ? suggestion.ingredient
              : { name: item.name, quantity: item.quantity, unit: item.unit },
          ),
        );
        return;

      case 'remove-ingredient':
        await this.recipes.replaceIngredients(
          username,
          recipe.id,
          recipe.ingredients
            .filter((item) => item.id !== suggestion.ingredientId)
            .map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit })),
        );
        return;

      case 'add-prep':
        await this.recipes.replacePrep(username, recipe.id, [
          ...toTextInputs(recipe.prep),
          { text: suggestion.text },
        ]);
        return;

      case 'update-prep':
        await this.recipes.replacePrep(
          username,
          recipe.id,
          recipe.prep.map((item) =>
            item.id === suggestion.prepId ? { text: suggestion.text } : { text: item.text },
          ),
        );
        return;

      case 'remove-prep':
        await this.recipes.replacePrep(
          username,
          recipe.id,
          recipe.prep
            .filter((item) => item.id !== suggestion.prepId)
            .map((item) => ({ text: item.text })),
        );
        return;

      case 'add-step':
        await this.recipes.replaceSteps(username, recipe.id, [
          ...toTextInputs(recipe.steps),
          { text: suggestion.text },
        ]);
        return;

      case 'update-step':
        await this.recipes.replaceSteps(
          username,
          recipe.id,
          recipe.steps.map((item) =>
            item.id === suggestion.stepId ? { text: suggestion.text } : { text: item.text },
          ),
        );
        return;

      case 'remove-step':
        await this.recipes.replaceSteps(
          username,
          recipe.id,
          recipe.steps
            .filter((item) => item.id !== suggestion.stepId)
            .map((item) => ({ text: item.text })),
        );
    }
  }
}

function toIngredientInputs(recipe: RecipeDetail): IngredientInput[] {
  return recipe.ingredients.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
  }));
}

function toTextInputs(items: ReadonlyArray<{ text: string }>): (PrepItemInput | StepInput)[] {
  return items.map((item) => ({ text: item.text }));
}
