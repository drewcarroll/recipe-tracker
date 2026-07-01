/**
 * Shared database types — the single source of truth that every Supabase query
 * is typed against. Mirrors `supabase/migrations/0001_initial_schema.sql`.
 *
 * Shape follows Supabase's generated-types convention (`Database` with
 * `public.Tables` / `public.Views`), so the client can be created as
 * `SupabaseClient<Database>` and all query builders become fully typed.
 *
 * These types describe DB rows and must not leak past the infrastructure
 * layer — use cases work with domain entities / DTOs, never these rows.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * The cook-session snapshot types are owned by the shared application module
 * (the single source of truth, validated by Zod) and re-exported here so the
 * `snapshot` column type and the validated domain type are the same type.
 */
export type { RecipeSnapshot, SnapshotIngredient } from '@application/types';

import type { RecipeSnapshot } from '@application/types';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          username: string;
          auth_user_id: string | null;
          created_at: string;
        };
        Insert: {
          username: string;
          auth_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          username?: string;
          auth_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          name: string;
          color: string;
          icon: string;
          username: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          icon: string;
          username: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          icon?: string;
          username?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          quantity: string;
          unit: string;
          name: string;
          position: number;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          quantity?: string;
          unit?: string;
          name: string;
          position?: number;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          quantity?: string;
          unit?: string;
          name?: string;
          position?: number;
        };
        Relationships: [];
      };
      prep_items: {
        Row: {
          id: string;
          recipe_id: string;
          text: string;
          position: number;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          text: string;
          position?: number;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          text?: string;
          position?: number;
        };
        Relationships: [];
      };
      steps: {
        Row: {
          id: string;
          recipe_id: string;
          text: string;
          position: number;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          text: string;
          position?: number;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          text?: string;
          position?: number;
        };
        Relationships: [];
      };
      cook_sessions: {
        Row: {
          id: string;
          recipe_id: string | null;
          recipe_name: string;
          snapshot: RecipeSnapshot;
          cook_notes: string;
          notes: string;
          duration_seconds: number;
          username: string | null;
          cooked_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id?: string | null;
          recipe_name: string;
          snapshot: RecipeSnapshot;
          cook_notes?: string;
          notes?: string;
          duration_seconds?: number;
          username?: string | null;
          cooked_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipe_id?: string | null;
          recipe_name?: string;
          snapshot?: RecipeSnapshot;
          cook_notes?: string;
          notes?: string;
          duration_seconds?: number;
          username?: string | null;
          cooked_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      recipes_with_stats: {
        Row: {
          id: string;
          name: string;
          color: string;
          icon: string;
          username: string;
          created_at: string;
          updated_at: string;
          times_cooked: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

// ---------------------------------------------------------------------------
// Convenience aliases — the "shared types" data-access helpers are written
// against. Importing these keeps call sites decoupled from the nested shape.
// ---------------------------------------------------------------------------
type Tables = Database['public']['Tables'];

export type UserRow = Tables['users']['Row'];
export type UserInsert = Tables['users']['Insert'];
export type UserUpdate = Tables['users']['Update'];

export type RecipeRow = Tables['recipes']['Row'];
export type RecipeInsert = Tables['recipes']['Insert'];
export type RecipeUpdate = Tables['recipes']['Update'];

export type IngredientRow = Tables['ingredients']['Row'];
export type IngredientInsert = Tables['ingredients']['Insert'];
export type IngredientUpdate = Tables['ingredients']['Update'];

export type PrepItemRow = Tables['prep_items']['Row'];
export type PrepItemInsert = Tables['prep_items']['Insert'];
export type PrepItemUpdate = Tables['prep_items']['Update'];

export type StepRow = Tables['steps']['Row'];
export type StepInsert = Tables['steps']['Insert'];
export type StepUpdate = Tables['steps']['Update'];

export type CookSessionRow = Tables['cook_sessions']['Row'];
export type CookSessionInsert = Tables['cook_sessions']['Insert'];
export type CookSessionUpdate = Tables['cook_sessions']['Update'];

export type RecipeWithStatsRow = Database['public']['Views']['recipes_with_stats']['Row'];
