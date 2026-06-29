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

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: RecipeRow;
        Insert: RecipeRow;
        Update: Partial<RecipeRow>;
      };
    };
  };
}
