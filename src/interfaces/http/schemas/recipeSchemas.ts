import { z } from 'zod';

/**
 * Input validation schemas. Validation here is structural/schema-level only.
 * Business rules are enforced inside the domain layer.
 */
export const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(z.string().min(1)).min(1),
  servings: z.number().int().positive(),
  prepTimeMinutes: z.number().int().nonnegative(),
  cookTimeMinutes: z.number().int().nonnegative(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
