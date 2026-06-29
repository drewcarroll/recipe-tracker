import { RecipeRepository } from '@domain/repositories/RecipeRepository';
import { RecipeDTO } from '../dtos/RecipeDTO';
import { RecipeMapper } from '../mappers/RecipeMapper';

/** Use Case: list all recipes. */
export class ListRecipesUseCase {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async execute(): Promise<RecipeDTO[]> {
    const recipes = await this.recipeRepository.findAll();
    return recipes.map(RecipeMapper.toDTO);
  }
}
