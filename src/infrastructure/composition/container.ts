import { CreateRecipeUseCase } from '@application/use-cases/CreateRecipeUseCase';
import { GetRecipeUseCase } from '@application/use-cases/GetRecipeUseCase';
import { ListRecipesUseCase } from '@application/use-cases/ListRecipesUseCase';
import { SupabaseRecipeRepository } from '../repositories/SupabaseRecipeRepository';
import { CryptoIdGenerator } from '../services/CryptoIdGenerator';
import { SupabaseClientFactory } from '../supabase/SupabaseClientFactory';

/**
 * Composition Root (Dependency Injection container).
 * This is the ONLY place where concrete implementations are wired into
 * use cases. The interfaces layer pulls fully-constructed use cases from here
 * and never references infrastructure directly.
 */
function buildRepository(): SupabaseRecipeRepository {
  return new SupabaseRecipeRepository(SupabaseClientFactory.getServerClient());
}

export const container = {
  createRecipeUseCase(): CreateRecipeUseCase {
    return new CreateRecipeUseCase(buildRepository(), new CryptoIdGenerator());
  },
  getRecipeUseCase(): GetRecipeUseCase {
    return new GetRecipeUseCase(buildRepository());
  },
  listRecipesUseCase(): ListRecipesUseCase {
    return new ListRecipesUseCase(buildRepository());
  },
};

export type Container = typeof container;
