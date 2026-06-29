import type { UserRepository } from '@application/ports/UserRepository';
import type { User } from '@application/types';

import { users } from '@infrastructure/data-access';
import { getServiceRoleClient } from '@infrastructure/supabase/client';
import type { UserRow } from '@infrastructure/supabase/types';

/** Map a raw `users` row to the application's `User` shape. */
function toUser(row: UserRow): User {
  return { username: row.username, authUserId: row.auth_user_id };
}

/**
 * Supabase-backed {@link UserRepository}. Uses the service-role client because
 * authorization is enforced in code (every query is scoped by username) rather
 * than by RLS while auth is lightweight (idea.md §0).
 */
export class SupabaseUserRepository implements UserRepository {
  async ensureUser(username: string): Promise<User> {
    const row = await users.ensureUser(getServiceRoleClient(), username);
    return toUser(row);
  }
}
