import type { RecipeRepository } from '@application/ports/RecipeRepository';
import type { RecipeSummary } from '@application/types';

import { recipes } from '@infrastructure/data-access';
import { getServiceRoleClient } from '@infrastructure/supabase/client';
import type { RecipeWithStatsRow } from '@infrastructure/supabase/types';

/** Map a `recipes_with_stats` view row to the application's summary shape. */
function toSummary(row: RecipeWithStatsRow): RecipeSummary {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    username: row.username,
    timesCooked: row.times_cooked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Supabase-backed {@link RecipeRepository}. Uses the service-role client because
 * authorization is enforced in code (every query is scoped by username) rather
 * than by RLS while auth is lightweight (idea.md §0).
 */
export class SupabaseRecipeRepository implements RecipeRepository {
  async listSummaries(username: string): Promise<RecipeSummary[]> {
    const rows = await recipes.listRecipesWithStats(getServiceRoleClient(), username);
    return rows.map(toSummary);
  }
}
