/**
 * Typed data-access layer for Recipe Tracker.
 *
 * Every helper takes a {@link TypedSupabaseClient} and is scoped by username,
 * so callers cannot read or mutate another user's data. All queries are typed
 * against the shared `Database` types in `../supabase/types`.
 *
 * Usage:
 *   import { getServiceRoleClient } from '@infrastructure/supabase/client';
 *   import { recipes } from '@infrastructure/data-access';
 *   const db = getServiceRoleClient();
 *   const list = await recipes.listRecipesWithStats(db, username);
 */

export * from './internal';

export * as users from './users';
export * as recipes from './recipes';
export * as ingredients from './ingredients';
export * as prepItems from './prepItems';
export * as steps from './steps';
export * as cookSessions from './cookSessions';
