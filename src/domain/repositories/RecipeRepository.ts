import { Recipe } from '../entities/Recipe';
import { RecipeId } from '../value-objects/RecipeId';

/**
 * Repository interface (a "port") for persisting and retrieving Recipes.
 * Describes WHAT can be done, never HOW. Implementations live in infrastructure.
 */
export interface RecipeRepository {
  save(recipe: Recipe): Promise<void>;
  findById(id: RecipeId): Promise<Recipe | null>;
  findAll(): Promise<Recipe[]>;
  delete(id: RecipeId): Promise<void>;
}
