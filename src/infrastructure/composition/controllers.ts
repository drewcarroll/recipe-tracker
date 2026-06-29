import { RecipeController } from '@interfaces/http/RecipeController';
import { container } from './container';

/**
 * Wiring helper that lives in infrastructure (the composition root layer),
 * where it is permitted to know both the container and the interface
 * controllers. This keeps the Next.js `app/` route files as a thin shell.
 */
export function buildRecipeController(): RecipeController {
  return new RecipeController(
    container.createRecipeUseCase(),
    container.getRecipeUseCase(),
    container.listRecipesUseCase(),
  );
}
