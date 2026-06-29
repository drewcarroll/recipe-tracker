import type { UserRepository } from '@application/ports/UserRepository';
import { usernameSchema, type User } from '@application/types';

/**
 * "Log in" with lightweight username auth (idea.md §0): create the user if new,
 * otherwise load them. Validates and normalises the raw input before touching
 * the repository, so callers (HTTP routes, etc.) only have to hand over the
 * untrusted string.
 */
export class EnsureUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(rawUsername: string): Promise<User> {
    const username = usernameSchema.parse(rawUsername.trim());
    return this.users.ensureUser(username);
  }
}
