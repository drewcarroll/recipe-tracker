import type { CookSessionRepository } from '@application/ports/CookSessionRepository';
import { usernameSchema, type CookSession } from '@application/types';

/**
 * Load a user's cook history (idea.md §4): every logged cook, most recent
 * first, each carrying the immutable snapshot it was recorded with. Validates
 * and normalises the raw username before touching the repository, so callers
 * (HTTP routes, etc.) only have to hand over the untrusted string.
 */
export class ListCookSessionsUseCase {
  constructor(private readonly sessions: CookSessionRepository) {}

  async execute(rawUsername: string): Promise<CookSession[]> {
    const username = usernameSchema.parse(rawUsername.trim());
    return this.sessions.list(username);
  }
}
