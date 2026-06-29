import type {
  Ingredient,
  IngredientInput,
  PrepItem,
  PrepItemInput,
  RecipeDetail,
  RecipeSummary,
  Step,
  StepInput,
} from '@application/types';

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

  /**
   * Load a single recipe with its ordered ingredients, prep, and steps for the
   * editor (idea.md §2), or null if it does not exist for `username`.
   */
  getDetail(username: string, recipeId: string): Promise<RecipeDetail | null>;

  /** Replace a recipe's whole ingredient list, returning the saved rows. */
  replaceIngredients(
    username: string,
    recipeId: string,
    items: IngredientInput[],
  ): Promise<Ingredient[]>;

  /** Replace a recipe's whole prep list, returning the saved rows. */
  replacePrep(username: string, recipeId: string, items: PrepItemInput[]): Promise<PrepItem[]>;

  /** Replace a recipe's whole step list (in order), returning the saved rows. */
  replaceSteps(username: string, recipeId: string, items: StepInput[]): Promise<Step[]>;
}
