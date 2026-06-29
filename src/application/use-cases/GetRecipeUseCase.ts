import { RecipeNotFoundError } from '@domain/errors/DomainError';
import { RecipeRepository } from '@domain/repositories/RecipeRepository';
import { RecipeId } from '@domain/value-objects/RecipeId';
import { RecipeDTO } from '../dtos/RecipeDTO';
import { RecipeMapper } from '../mappers/RecipeMapper';

/** Use Case: fetch a single recipe by its id. */
export class GetRecipeUseCase {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async execute(dto: { id: string }): Promise<RecipeDTO> {
    const recipe = await this.recipeRepository.findById(RecipeId.create(dto.id));
    if (!recipe) {
      throw new RecipeNotFoundError(dto.id);
    }
    return RecipeMapper.toDTO(recipe);
  }
}
