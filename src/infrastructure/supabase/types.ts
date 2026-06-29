/**
 * Database row types as they exist in Supabase/Postgres.
 * These types MUST NOT leak past the infrastructure layer — repositories
 * map them into domain entities before returning.
 */
export interface RecipeRow {
  id: string;
  title: string;
  description: string;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: string[];
  servings: number;
  prep_time_minutes: number;
  cook_time_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
}

/**
 * Row of the `recipes_with_stats` view: a recipe plus its derived stats.
 * `times_cooked` is computed as the number of cook_sessions for the recipe.
 */
export interface RecipeWithStatsRow extends RecipeRow {
  times_cooked: number;
}

/** A single recorded cooking session for a recipe. */
export interface CookSessionRow {
  id: string;
  recipe_id: string;
  cooked_at: string;
  notes: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: RecipeRow;
        Insert: RecipeRow;
        Update: Partial<RecipeRow>;
      };
      cook_sessions: {
        Row: CookSessionRow;
        Insert: CookSessionRow;
        Update: Partial<CookSessionRow>;
      };
    };
    Views: {
      recipes_with_stats: {
        Row: RecipeWithStatsRow;
      };
    };
  };
}
