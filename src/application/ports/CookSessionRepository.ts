import type { CookSession, CreateCookSessionInput } from '@application/types';

/**
 * Port describing how the application persists cook sessions, without knowing
 * which database backs it. A session is an IMMUTABLE record of one cook
 * (idea.md §4): created once with its frozen snapshot and never updated — so
 * the writes are {@link create} and {@link delete} (removing a logged cook),
 * never an in-place edit. {@link list} backs the History tab. Infrastructure
 * provides the implementation; use cases depend only on this interface.
 */
export interface CookSessionRepository {
  /** Record a completed cook session for `username`, returning the saved row. */
  create(username: string, input: CreateCookSessionInput): Promise<CookSession>;

  /** List a user's cook sessions, most recent first (the History log). */
  list(username: string): Promise<CookSession[]>;

  /** Delete one of a user's cook sessions (idea.md §4). */
  delete(username: string, sessionId: string): Promise<void>;
}
