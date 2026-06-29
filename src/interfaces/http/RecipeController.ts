import { CreateRecipeUseCase } from '@application/use-cases/CreateRecipeUseCase';
import { GetRecipeUseCase } from '@application/use-cases/GetRecipeUseCase';
import { ListRecipesUseCase } from '@application/use-cases/ListRecipesUseCase';
import { createRecipeSchema } from './schemas/recipeSchemas';

/**
 * Thin HTTP controller. Responsibilities ONLY:
 *   1. validate/parse input (schema-level)
 *   2. call the relevant use case
 *   3. shape the HTTP response (status + body)
 *
 * It depends solely on the application layer (use cases). Use cases are
 * injected, so this controller never touches infrastructure or the container.
 */
export interface HttpResult {
  status: number;
  body: unknown;
}

export class RecipeController {
  constructor(
    private readonly createRecipe: CreateRecipeUseCase,
    private readonly getRecipe: GetRecipeUseCase,
    private readonly listRecipes: ListRecipesUseCase,
  ) {}

  async create(rawBody: unknown): Promise<HttpResult> {
    const parsed = createRecipeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return { status: 400, body: { error: 'ValidationError', details: parsed.error.flatten() } };
    }
    const recipe = await this.createRecipe.execute(parsed.data);
    return { status: 201, body: recipe };
  }

  async getById(id: string): Promise<HttpResult> {
    const recipe = await this.getRecipe.execute({ id });
    return { status: 200, body: recipe };
  }

  async list(): Promise<HttpResult> {
    const recipes = await this.listRecipes.execute();
    return { status: 200, body: recipes };
  }
}
