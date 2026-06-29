'use client';

import { useUser } from './_components/user-context';

/**
 * App home. A placeholder until the Recipes/Cook/History tabs land — its job
 * here is to prove the session context works and that an unauthenticated
 * visitor is redirected to the username entry screen by the provider guard.
 */
export default function HomePage(): JSX.Element | null {
  const { username, status, signOut } = useUser();

  // While loading, or before the guard redirects a signed-out visitor, render
  // nothing to avoid a flash of content.
  if (status === 'loading' || !username) {
    return null;
  }

  return (
    <main className="screen">
      <div className="card">
        <h1 className="title">Welcome, {username} 👋</h1>
        <p className="subtitle">You&rsquo;re signed in. Recipes, Cook and History will live here.</p>
        <button className="button button-secondary" type="button" onClick={signOut}>
          Sign out
        </button>
      </div>
    </main>
  );
}
