import { SupabaseClient } from '@supabase/supabase-js';
import { Recipe } from '@domain/entities/Recipe';
import { DomainError } from '@domain/errors/DomainError';
import { RecipeRepository } from '@domain/repositories/RecipeRepository';
import { Ingredient } from '@domain/value-objects/Ingredient';
import { RecipeId } from '@domain/value-objects/RecipeId';
import { Database, RecipeRow } from '../supabase/types';

/**
 * Supabase-backed implementation of the RecipeRepository domain interface.
 * Responsibilities: map DB rows <-> domain entities, translate DB errors.
 * Contains NO business logic.
 */
export class SupabaseRecipeRepository implements RecipeRepository {
  private static readonly TABLE = 'recipes';

  constructor(private readonly client: SupabaseClient<Database>) {}

  async save(recipe: Recipe): Promise<void> {
    const row = SupabaseRecipeRepository.toRow(recipe);
    const { error } = await this.client
      .from(SupabaseRecipeRepository.TABLE)
      .upsert(row, { onConflict: 'id' });

    if (error) {
      throw new RepositoryError(`Failed to save recipe: ${error.message}`);
    }
  }

  async findById(id: RecipeId): Promise<Recipe | null> {
    const { data, error } = await this.client
      .from(SupabaseRecipeRepository.TABLE)
      .select('*')
      .eq('id', id.toString())
      .maybeSingle();

    if (error) {
      throw new RepositoryError(`Failed to fetch recipe: ${error.message}`);
    }
    return data ? SupabaseRecipeRepository.toDomain(data) : null;
  }

  async findAll(): Promise<Recipe[]> {
    const { data, error } = await this.client
      .from(SupabaseRecipeRepository.TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new RepositoryError(`Failed to list recipes: ${error.message}`);
    }
    return (data ?? []).map(SupabaseRecipeRepository.toDomain);
  }

  async delete(id: RecipeId): Promise<void> {
    const { error } = await this.client
      .from(SupabaseRecipeRepository.TABLE)
      .delete()
      .eq('id', id.toString());

    if (error) {
      throw new RepositoryError(`Failed to delete recipe: ${error.message}`);
    }
  }

  // ---- Mapping helpers ----

  private static toRow(recipe: Recipe): RecipeRow {
    return {
      id: recipe.id.toString(),
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      })),
      steps: [...recipe.steps],
      servings: recipe.servings,
      prep_time_minutes: recipe.prepTimeMinutes,
      cook_time_minutes: recipe.cookTimeMinutes,
      difficulty: recipe.difficulty,
      times_cooked: recipe.timesCooked,
      created_at: recipe.createdAt.toISOString(),
      updated_at: recipe.updatedAt.toISOString(),
    };
  }

  private static toDomain(row: RecipeRow): Recipe {
    return Recipe.create({
      id: RecipeId.create(row.id),
      title: row.title,
      description: row.description,
      ingredients: row.ingredients.map((i) => Ingredient.create(i)),
      steps: row.steps,
      servings: row.servings,
      prepTimeMinutes: row.prep_time_minutes,
      cookTimeMinutes: row.cook_time_minutes,
      difficulty: row.difficulty,
      timesCooked: row.times_cooked ?? 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}

/** Infrastructure error re-thrown as a domain-recognisable error. */
export class RepositoryError extends DomainError {}
