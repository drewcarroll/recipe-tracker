import type { User } from '@application/types';

/**
 * Port describing how the application persists/loads users, without knowing
 * which database backs it. Infrastructure provides the implementation; use
 * cases depend only on this interface (Clean Architecture dependency rule).
 */
export interface UserRepository {
  /**
   * Return the existing user for `username`, creating them on first sight.
   * Idempotent, so the username-only login flow (idea.md §0) can call it
   * freely.
   */
  ensureUser(username: string): Promise<User>;
}
