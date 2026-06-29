import { ValidationError } from '../errors/DomainError';
import { Recipe } from '../entities/Recipe';
import { Ingredient } from '../value-objects/Ingredient';

/**
 * Domain Service: logic that spans value objects / does not belong to a
 * single entity method. Scales a recipe's ingredient quantities for a
 * different number of servings.
 */
export class RecipeScalingService {
  scaleIngredients(recipe: Recipe, targetServings: number): Ingredient[] {
    if (!Number.isInteger(targetServings) || targetServings <= 0) {
      throw new ValidationError('Target servings must be a positive integer.');
    }
    const factor = targetServings / recipe.servings;
    return recipe.ingredients.map((ing) =>
      Ingredient.create({
        name: ing.name,
        quantity: Math.round(ing.quantity * factor * 100) / 100,
        unit: ing.unit,
      }),
    );
  }
}
