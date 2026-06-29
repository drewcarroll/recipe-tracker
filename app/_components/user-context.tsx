'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { User } from '@application/types';

/**
 * Active-user session context (idea.md §0).
 *
 * Holds the signed-in username, persists it to localStorage so it survives
 * reloads, and exposes it to the whole app. Every data-access call is scoped to
 * this username, so this is the single source of truth for "who is using the
 * app right now". While auth stays lightweight there is no password — entering a
 * username creates the account if new, otherwise loads it.
 */

const STORAGE_KEY = 'recipe-tracker.username';
const LOGIN_PATH = '/login';

type Status = 'loading' | 'ready';

interface UserContextValue {
  /** The active username, or `null` when signed out. */
  username: string | null;
  /** `loading` until the persisted username has been read on the client. */
  status: Status;
  /** Create-or-fetch the user, then persist and activate the username. */
  signIn: (username: string) => Promise<void>;
  /** Clear the active username and return to the entry screen. */
  signOut: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }): JSX.Element {
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const router = useRouter();
  const pathname = usePathname();

  // Rehydrate the active username from localStorage once, on the client.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUsername(stored);
      }
    } catch {
      // localStorage may be unavailable (private mode); treat as signed out.
    }
    setStatus('ready');
  }, []);

  const signIn = useCallback(async (raw: string) => {
    const candidate = raw.trim();
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: candidate }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? 'Could not sign in right now. Please try again.');
    }

    const { user } = (await response.json()) as { user: User };
    try {
      window.localStorage.setItem(STORAGE_KEY, user.username);
    } catch {
      // Persistence is best-effort; the session still works for this tab.
    }
    setUsername(user.username);
  }, []);

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore — clearing in-memory state below is what matters.
    }
    setUsername(null);
    router.replace(LOGIN_PATH);
  }, [router]);

  // Guard: once hydrated, anyone without an active username is sent to the
  // entry screen (acceptance criterion 4).
  useEffect(() => {
    if (status !== 'ready') {
      return;
    }
    if (!username && pathname !== LOGIN_PATH) {
      router.replace(LOGIN_PATH);
    }
  }, [status, username, pathname, router]);

  const value = useMemo<UserContextValue>(
    () => ({ username, status, signIn, signOut }),
    [username, status, signIn, signOut],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/** Access the active-user session. Throws if used outside a {@link UserProvider}. */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
