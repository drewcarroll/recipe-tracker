import type { CookSessionRepository } from '@application/ports/CookSessionRepository';
import type { CookSession, CreateCookSessionInput } from '@application/types';

import { cookSessions } from '@infrastructure/data-access';
import { getServiceRoleClient } from '@infrastructure/supabase/client';
import type { CookSessionRow } from '@infrastructure/supabase/types';

/** Map a `cook_sessions` row to the application's {@link CookSession}. */
function toCookSession(row: CookSessionRow): CookSession {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    recipeName: row.recipe_name,
    snapshot: row.snapshot,
    deviations: row.deviations,
    notes: row.notes,
    durationSeconds: row.duration_seconds,
    username: row.username,
    cookedAt: row.cooked_at,
    createdAt: row.created_at,
  };
}

/**
 * Supabase-backed {@link CookSessionRepository}. Uses the service-role client
 * because authorization is enforced in code (every query is scoped by username)
 * rather than by RLS while auth is lightweight (idea.md §0).
 */
export class SupabaseCookSessionRepository implements CookSessionRepository {
  async create(username: string, input: CreateCookSessionInput): Promise<CookSession> {
    const row = await cookSessions.createCookSession(getServiceRoleClient(), username, {
      recipeId: input.recipeId,
      recipeName: input.recipeName,
      snapshot: input.snapshot,
      deviations: input.deviations,
      notes: input.notes,
      durationSeconds: input.durationSeconds,
    });
    return toCookSession(row);
  }

  async list(username: string): Promise<CookSession[]> {
    const rows = await cookSessions.listCookSessions(getServiceRoleClient(), username);
    return rows.map(toCookSession);
  }

  async delete(username: string, sessionId: string): Promise<void> {
    await cookSessions.deleteCookSession(getServiceRoleClient(), username, sessionId);
  }
}
