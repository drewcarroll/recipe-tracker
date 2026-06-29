import { z } from 'zod';

/**
 * Shared application types + runtime validation for Recipe Tracker.
 *
 * This is the single source of truth for the app's core data shapes. Every
 * type is INFERRED from its Zod schema (`z.infer<...>`), so the validator and
 * the TypeScript type can never drift apart.
 *
 * Lives in the application layer because it is the one layer both `interfaces/`
 * (HTTP input validation) and `infrastructure/` (validating Claude's JSON
 * output, mapping DB rows) are allowed to depend on. `domain/` stays free of
 * the `zod` dependency.
 *
 * Mirrors the database schema in `supabase/migrations/0001_initial_schema.sql`
 * and the product spec in `idea.md`.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Lightweight account identifier (idea.md §0). */
export const usernameSchema = z.string().min(1).max(50);

/**
 * ISO-8601 timestamp string as returned by Supabase (timestamptz). Kept as a
 * plain string rather than `.datetime()` to avoid false negatives on the
 * microsecond-precision / offset formats Postgres emits.
 */
export const timestampSchema = z.string().min(1);

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export const userSchema = z.object({
  username: usernameSchema,
  /** Reserved for the future Supabase Auth mapping; null until then. */
  authUserId: z.string().uuid().nullable().optional(),
});
export type User = z.infer<typeof userSchema>;

// ---------------------------------------------------------------------------
// Ingredient
//
// The core "value" of an ingredient is name + quantity + unit (idea.md §2).
// Quantity/unit are free-form strings ("1/2", "a pinch", "") and default to
// empty so Claude output that omits them still validates.
// ---------------------------------------------------------------------------

export const ingredientValueSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().default(''),
  unit: z.string().default(''),
});
export type IngredientValue = z.infer<typeof ingredientValueSchema>;

/** A persisted ingredient adds identity and display ordering. */
export const ingredientSchema = ingredientValueSchema.extend({
  id: z.string().uuid(),
  position: z.number().int().nonnegative(),
});
export type Ingredient = z.infer<typeof ingredientSchema>;

// ---------------------------------------------------------------------------
// Prep item & Step — ordered text items belonging to a recipe (idea.md §2)
// ---------------------------------------------------------------------------

export const prepItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  position: z.number().int().nonnegative(),
});
export type PrepItem = z.infer<typeof prepItemSchema>;

export const stepSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  position: z.number().int().nonnegative(),
});
export type Step = z.infer<typeof stepSchema>;

// ---------------------------------------------------------------------------
// Recipe — the aggregate: basic info + ingredients + prep + steps (idea.md §2)
// ---------------------------------------------------------------------------

export const recipeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  /** Pastel palette key (idea.md §2); palette membership is a UI concern. */
  color: z.string().min(1),
  /** Curated icon key (idea.md §2). */
  icon: z.string().min(1),
  username: usernameSchema,
  ingredients: z.array(ingredientSchema),
  prep: z.array(prepItemSchema),
  steps: z.array(stepSchema),
  /** Derived from cook session count (idea.md §4); not stored on the row. */
  timesCooked: z.number().int().nonnegative().default(0),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Recipe = z.infer<typeof recipeSchema>;

/**
 * Lightweight recipe row for the "Your Recipes" list (idea.md §2): the card
 * fields plus the derived "Times cooked" count, without the heavy
 * ingredients/prep/steps arrays. Backs the recipe list page.
 */
export const recipeSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string().min(1),
  icon: z.string().min(1),
  username: usernameSchema,
  /** Count of this recipe's cook sessions (idea.md §4). */
  timesCooked: z.number().int().nonnegative(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type RecipeSummary = z.infer<typeof recipeSummarySchema>;

/**
 * A recipe with its full, ordered contents for the detail/editor page
 * (idea.md §2): basic info plus the ingredients, prep, and steps lists. Backs
 * the editable sections.
 */
export const recipeDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string().min(1),
  icon: z.string().min(1),
  username: usernameSchema,
  ingredients: z.array(ingredientSchema),
  prep: z.array(prepItemSchema),
  steps: z.array(stepSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type RecipeDetail = z.infer<typeof recipeDetailSchema>;

// ---------------------------------------------------------------------------
// Deviation — something done differently during a cook (idea.md §3).
// Free-text note, stored on the session (matches the `deviations` jsonb column,
// an array of notes).
// ---------------------------------------------------------------------------

export const deviationSchema = z.string().min(1);
export type Deviation = z.infer<typeof deviationSchema>;

// ---------------------------------------------------------------------------
// Recipe snapshot — IMMUTABLE copy of a recipe's contents as-at-cook-time
// (idea.md §4, acceptance criterion 3). Self-contained: stores ingredient
// values / prep text / step text by value so later recipe edits never alter
// history.
// ---------------------------------------------------------------------------

/** An ingredient frozen into a snapshot (name + quantity + unit, no identity). */
export const snapshotIngredientSchema = ingredientValueSchema;
export type SnapshotIngredient = IngredientValue;

export const recipeSnapshotSchema = z.object({
  ingredients: z.array(snapshotIngredientSchema),
  prep: z.array(z.string()),
  steps: z.array(z.string()),
});
export type RecipeSnapshot = z.infer<typeof recipeSnapshotSchema>;

// ---------------------------------------------------------------------------
// Cook session — one logged cook (idea.md §4). The snapshot + recipeName make
// it independent of the live recipe rows.
// ---------------------------------------------------------------------------

export const cookSessionSchema = z.object({
  id: z.string().uuid(),
  /** Originating recipe; null once that recipe is deleted. */
  recipeId: z.string().uuid().nullable(),
  /** Recipe name frozen at cook time. */
  recipeName: z.string().min(1),
  snapshot: recipeSnapshotSchema,
  deviations: z.array(deviationSchema),
  notes: z.string(),
  durationSeconds: z.number().int().nonnegative(),
  username: usernameSchema.nullable(),
  cookedAt: timestampSchema,
  createdAt: timestampSchema,
});
export type CookSession = z.infer<typeof cookSessionSchema>;

// ---------------------------------------------------------------------------
// Claude structured-recipe payload — the result of "paste a recipe" parsed by
// Claude into a structured recipe (idea.md §2). This is untrusted LLM output,
// so its schema is the most important one to validate at runtime.
// ---------------------------------------------------------------------------

export const structuredRecipeSchema = z.object({
  name: z.string().min(1),
  ingredients: z.array(ingredientValueSchema),
  prep: z.array(z.string()),
  steps: z.array(z.string()),
});
export type StructuredRecipe = z.infer<typeof structuredRecipeSchema>;

// ---------------------------------------------------------------------------
// Input / write schemas — for validating incoming data at the boundaries
// (HTTP bodies, use-case inputs) before persistence. Server-generated fields
// (id, timestamps, position) are omitted or optional.
// ---------------------------------------------------------------------------

export const ingredientInputSchema = ingredientValueSchema.extend({
  position: z.number().int().nonnegative().optional(),
});
export type IngredientInput = z.infer<typeof ingredientInputSchema>;

export const prepItemInputSchema = z.object({
  text: z.string().min(1),
  position: z.number().int().nonnegative().optional(),
});
export type PrepItemInput = z.infer<typeof prepItemInputSchema>;

export const stepInputSchema = z.object({
  text: z.string().min(1),
  position: z.number().int().nonnegative().optional(),
});
export type StepInput = z.infer<typeof stepInputSchema>;

/** A recipe's editable basic info (idea.md §2): name, color, icon. */
export const recipeBasicsSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  icon: z.string().min(1),
});
export type RecipeBasics = z.infer<typeof recipeBasicsSchema>;

export const createRecipeInputSchema = recipeBasicsSchema.extend({
  ingredients: z.array(ingredientInputSchema).default([]),
  prep: z.array(prepItemInputSchema).default([]),
  steps: z.array(stepInputSchema).default([]),
});
export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

export const updateRecipeInputSchema = z
  .object({
    name: z.string().min(1),
    color: z.string().min(1),
    icon: z.string().min(1),
  })
  .partial();
export type UpdateRecipeInput = z.infer<typeof updateRecipeInputSchema>;

export const createCookSessionInputSchema = z.object({
  recipeId: z.string().uuid().nullable(),
  recipeName: z.string().min(1),
  snapshot: recipeSnapshotSchema,
  deviations: z.array(deviationSchema).default([]),
  notes: z.string().default(''),
  durationSeconds: z.number().int().nonnegative().default(0),
});
export type CreateCookSessionInput = z.infer<typeof createCookSessionInputSchema>;
