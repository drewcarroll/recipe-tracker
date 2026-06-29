import { Recipe } from '@domain/entities/Recipe';
import { RecipeDTO } from '../dtos/RecipeDTO';

/**
 * Maps domain entities to DTOs. Keeps the domain shape out of the
 * interfaces layer and guarantees use cases never return entities directly.
 */
export class RecipeMapper {
  static toDTO(recipe: Recipe): RecipeDTO {
    return {
      id: recipe.id.toString(),
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      })),
      steps: [...recipe.steps],
      servings: recipe.servings,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      totalTimeMinutes: recipe.totalTimeMinutes,
      difficulty: recipe.difficulty,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
    };
  }
}
