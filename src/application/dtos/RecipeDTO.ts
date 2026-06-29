/**
 * DTOs are the input/output contracts of the application layer.
 * They are plain data — never domain entities — so the outside world
 * (interfaces) never touches domain objects directly.
 */

export interface IngredientDTO {
  name: string;
  quantity: number;
  unit: string;
}

export type RecipeDifficultyDTO = 'easy' | 'medium' | 'hard';

/** Output DTO returned by use cases. */
export interface RecipeDTO {
  id: string;
  title: string;
  description: string;
  ingredients: IngredientDTO[];
  steps: string[];
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  difficulty: RecipeDifficultyDTO;
  createdAt: string;
  updatedAt: string;
}

/** Input DTO for creating a recipe. */
export interface CreateRecipeDTO {
  title: string;
  description?: string;
  ingredients: IngredientDTO[];
  steps: string[];
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty?: RecipeDifficultyDTO;
}
