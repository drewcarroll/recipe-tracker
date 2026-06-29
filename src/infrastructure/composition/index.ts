/**
 * Composition root — the one place concrete infrastructure is wired to the
 * application's use cases. Framework entry points (the Next.js `app/` route
 * handlers) pull fully-constructed use cases from here and delegate, so they
 * never import repositories or the database client directly.
 */

import { EnsureUserUseCase } from '@application/use-cases/EnsureUserUseCase';

import { SupabaseUserRepository } from '@infrastructure/repositories/SupabaseUserRepository';

let ensureUserUseCase: EnsureUserUseCase | null = null;

/** Lazily build and cache the username "log in / sign up" use case. */
export function getEnsureUserUseCase(): EnsureUserUseCase {
  if (!ensureUserUseCase) {
    ensureUserUseCase = new EnsureUserUseCase(new SupabaseUserRepository());
  }
  return ensureUserUseCase;
}
