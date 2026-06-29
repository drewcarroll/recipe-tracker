/**
 * Composition root — the one place concrete infrastructure is wired to the
 * application's use cases. Framework entry points (the Next.js `app/` route
 * handlers) pull fully-constructed use cases from here and delegate, so they
 * never import repositories or the database client directly.
 */

import { CreateRecipeUseCase } from '@application/use-cases/CreateRecipeUseCase';
import { EnsureUserUseCase } from '@application/use-cases/EnsureUserUseCase';
import { GetRecipeUseCase } from '@application/use-cases/GetRecipeUseCase';
import { ListRecipesUseCase } from '@application/use-cases/ListRecipesUseCase';
import { SaveRecipeSectionsUseCase } from '@application/use-cases/SaveRecipeSectionsUseCase';

import { SupabaseRecipeRepository } from '@infrastructure/repositories/SupabaseRecipeRepository';
import { SupabaseUserRepository } from '@infrastructure/repositories/SupabaseUserRepository';

let ensureUserUseCase: EnsureUserUseCase | null = null;
let listRecipesUseCase: ListRecipesUseCase | null = null;
let createRecipeUseCase: CreateRecipeUseCase | null = null;
let getRecipeUseCase: GetRecipeUseCase | null = null;
let saveRecipeSectionsUseCase: SaveRecipeSectionsUseCase | null = null;

/** A single repository instance, reused across the recipe use cases. */
let recipeRepository: SupabaseRecipeRepository | null = null;
function getRecipeRepository(): SupabaseRecipeRepository {
  if (!recipeRepository) {
    recipeRepository = new SupabaseRecipeRepository();
  }
  return recipeRepository;
}

/** Lazily build and cache the username "log in / sign up" use case. */
export function getEnsureUserUseCase(): EnsureUserUseCase {
  if (!ensureUserUseCase) {
    ensureUserUseCase = new EnsureUserUseCase(new SupabaseUserRepository());
  }
  return ensureUserUseCase;
}

/** Lazily build and cache the "Your Recipes" list use case. */
export function getListRecipesUseCase(): ListRecipesUseCase {
  if (!listRecipesUseCase) {
    listRecipesUseCase = new ListRecipesUseCase(getRecipeRepository());
  }
  return listRecipesUseCase;
}

/** Lazily build and cache the create-blank-recipe use case. */
export function getCreateRecipeUseCase(): CreateRecipeUseCase {
  if (!createRecipeUseCase) {
    createRecipeUseCase = new CreateRecipeUseCase(getRecipeRepository());
  }
  return createRecipeUseCase;
}

/** Lazily build and cache the recipe-detail load use case. */
export function getGetRecipeUseCase(): GetRecipeUseCase {
  if (!getRecipeUseCase) {
    getRecipeUseCase = new GetRecipeUseCase(getRecipeRepository());
  }
  return getRecipeUseCase;
}

/** Lazily build and cache the editable-sections save use case. */
export function getSaveRecipeSectionsUseCase(): SaveRecipeSectionsUseCase {
  if (!saveRecipeSectionsUseCase) {
    saveRecipeSectionsUseCase = new SaveRecipeSectionsUseCase(getRecipeRepository());
  }
  return saveRecipeSectionsUseCase;
}
