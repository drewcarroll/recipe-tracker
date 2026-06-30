import type { CookSessionRepository } from '@application/ports/CookSessionRepository';
import { usernameSchema } from '@application/types';

/**
 * Delete one logged cook session (idea.md §4). A session is an immutable
 * record, so removing it is the only edit the History tab allows. Because a
 * recipe's "Times cooked" count is derived from its sessions, deleting one
 * makes that count tick back down.
 */
export class DeleteCookSessionUseCase {
  constructor(private readonly sessions: CookSessionRepository) {}

  async execute(rawUsername: string, sessionId: string): Promise<void> {
    const username = usernameSchema.parse(rawUsername.trim());
    await this.sessions.delete(username, sessionId);
  }
}
