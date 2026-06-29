import { Recipe } from '@domain/entities/Recipe';
import { RecipeRepository } from '@domain/repositories/RecipeRepository';
import { Ingredient } from '@domain/value-objects/Ingredient';
import { RecipeId } from '@domain/value-objects/RecipeId';
import { CreateRecipeDTO, RecipeDTO } from '../dtos/RecipeDTO';
import { RecipeMapper } from '../mappers/RecipeMapper';
import { IdGenerator } from '../ports/IdGenerator';

/**
 * Use Case: create a new recipe.
 * Receives its dependencies (repository + id generator) via constructor (DI).
 * Orchestrates the domain; contains no business rules itself.
 */
export class CreateRecipeUseCase {
  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(dto: CreateRecipeDTO): Promise<RecipeDTO> {
    const recipe = Recipe.create({
      id: RecipeId.create(this.idGenerator.generate()),
      title: dto.title,
      description: dto.description,
      ingredients: dto.ingredients.map((i) => Ingredient.create(i)),
      steps: dto.steps,
      servings: dto.servings,
      prepTimeMinutes: dto.prepTimeMinutes,
      cookTimeMinutes: dto.cookTimeMinutes,
      difficulty: dto.difficulty,
    });

    await this.recipeRepository.save(recipe);

    return RecipeMapper.toDTO(recipe);
  }
}
