import { z } from 'zod';

import type { CookSessionRepository } from '@application/ports/CookSessionRepository';
import { createCookSessionInputSchema, usernameSchema, type CookSession } from '@application/types';

/**
 * Accepted input: the schema's *input* shape, so fields with defaults
 * (deviations, notes, durationSeconds) are optional for callers. The use case
 * applies the defaults via `parse` before persisting.
 */
type LogCookSessionInput = z.input<typeof createCookSessionInputSchema>;

/**
 * Record one completed guided cook (idea.md §3, §4): freeze the recipe's
 * contents into an immutable snapshot and log how long the cook took. This is
 * what makes a recipe's "Times cooked" count tick up and gives the History tab
 * something to show. Deviations and post-cook notes arrive with the later §3
 * work, so they default to empty here.
 */
export class LogCookSessionUseCase {
  constructor(private readonly sessions: CookSessionRepository) {}

  async execute(rawUsername: string, input: LogCookSessionInput): Promise<CookSession> {
    const username = usernameSchema.parse(rawUsername.trim());
    const validated = createCookSessionInputSchema.parse(input);
    return this.sessions.create(username, validated);
  }
}
