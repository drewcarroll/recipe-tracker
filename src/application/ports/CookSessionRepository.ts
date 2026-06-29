import type { CookSession, CreateCookSessionInput } from '@application/types';

/**
 * Port describing how the application persists cook sessions, without knowing
 * which database backs it. A session is an IMMUTABLE record of one cook
 * (idea.md §4): created once with its frozen snapshot and never updated, so the
 * only write the application needs is {@link create}. Infrastructure provides
 * the implementation; use cases depend only on this interface.
 */
export interface CookSessionRepository {
  /** Record a completed cook session for `username`, returning the saved row. */
  create(username: string, input: CreateCookSessionInput): Promise<CookSession>;
}
