/**
 * Composition root — the one place concrete infrastructure is wired to the
 * application's use cases. Framework entry points (the Next.js `app/` route
 * handlers) pull fully-constructed use cases from here and delegate, so they
 * never import repositories or the database client directly.
 */

import { CreateRecipeFromTextUseCase } from '@application/use-cases/CreateRecipeFromTextUseCase';
import { CreateRecipeUseCase } from '@application/use-cases/CreateRecipeUseCase';
import { DeleteRecipeUseCase } from '@application/use-cases/DeleteRecipeUseCase';
import { EnsureUserUseCase } from '@application/use-cases/EnsureUserUseCase';
import { GetRecipeUseCase } from '@application/use-cases/GetRecipeUseCase';
import { ListRecipesUseCase } from '@application/use-cases/ListRecipesUseCase';
import { ParseRecipeUseCase } from '@application/use-cases/ParseRecipeUseCase';
import { SaveRecipeSectionsUseCase } from '@application/use-cases/SaveRecipeSectionsUseCase';
import { UpdateRecipeUseCase } from '@application/use-cases/UpdateRecipeUseCase';

import { AnthropicRecipeParser } from '@infrastructure/llm/AnthropicRecipeParser';
import { SupabaseRecipeRepository } from '@infrastructure/repositories/SupabaseRecipeRepository';
import { SupabaseUserRepository } from '@infrastructure/repositories/SupabaseUserRepository';

let ensureUserUseCase: EnsureUserUseCase | null = null;
let listRecipesUseCase: ListRecipesUseCase | null = null;
let createRecipeUseCase: CreateRecipeUseCase | null = null;
let createRecipeFromTextUseCase: CreateRecipeFromTextUseCase | null = null;
let parseRecipeUseCase: ParseRecipeUseCase | null = null;
let getRecipeUseCase: GetRecipeUseCase | null = null;
let saveRecipeSectionsUseCase: SaveRecipeSectionsUseCase | null = null;
let updateRecipeUseCase: UpdateRecipeUseCase | null = null;
let deleteRecipeUseCase: DeleteRecipeUseCase | null = null;

/** A single repository instance, reused across the recipe use cases. */
let recipeRepository: SupabaseRecipeRepository | null = null;
function getRecipeRepository(): SupabaseRecipeRepository {
  if (!recipeRepository) {
    recipeRepository = new SupabaseRecipeRepository();
  }
  return recipeRepository;
}

/** A single recipe parser instance, reused across requests. */
let recipeParser: AnthropicRecipeParser | null = null;
function getRecipeParser(): AnthropicRecipeParser {
  if (!recipeParser) {
    recipeParser = new AnthropicRecipeParser();
  }
  return recipeParser;
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

/** Lazily build and cache the paste → structured recipe parse use case. */
export function getParseRecipeUseCase(): ParseRecipeUseCase {
  if (!parseRecipeUseCase) {
    parseRecipeUseCase = new ParseRecipeUseCase(getRecipeParser());
  }
  return parseRecipeUseCase;
}

/** Lazily build and cache the "Create using AI" (paste → structured) use case. */
export function getCreateRecipeFromTextUseCase(): CreateRecipeFromTextUseCase {
  if (!createRecipeFromTextUseCase) {
    createRecipeFromTextUseCase = new CreateRecipeFromTextUseCase(
      getRecipeParser(),
      getRecipeRepository(),
    );
  }
  return createRecipeFromTextUseCase;
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

/** Lazily build and cache the edit-basic-info use case. */
export function getUpdateRecipeUseCase(): UpdateRecipeUseCase {
  if (!updateRecipeUseCase) {
    updateRecipeUseCase = new UpdateRecipeUseCase(getRecipeRepository());
  }
  return updateRecipeUseCase;
}

/** Lazily build and cache the delete-recipe use case. */
export function getDeleteRecipeUseCase(): DeleteRecipeUseCase {
  if (!deleteRecipeUseCase) {
    deleteRecipeUseCase = new DeleteRecipeUseCase(getRecipeRepository());
  }
  return deleteRecipeUseCase;
}
