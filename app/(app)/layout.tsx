'use client';

import type { ReactNode } from 'react';

import { BottomNav } from '../_components/BottomNav';
import { useUser } from '../_components/user-context';

/**
 * Shell for the authenticated, tabbed area of the app: a slim header, the tab
 * content, and the bottom navbar. The username entry screen (`/login`) lives
 * outside this group, so it never shows the navbar.
 *
 * Rendering is gated on an active session — the provider guard redirects a
 * signed-out visitor to `/login`, and returning null here avoids a flash of
 * app content in the meantime.
 */
export default function AppLayout({ children }: { children: ReactNode }): JSX.Element | null {
  const { username, status, signOut } = useUser();

  if (status === 'loading' || !username) {
    return null;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-brand">🍳 Recipe Tracker</span>
        <button className="link-button" type="button" onClick={signOut}>
          Sign out
        </button>
      </header>
      <main className="app-main">{children}</main>
      <BottomNav />
    </div>
  );
}
