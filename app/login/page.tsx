'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { useUser } from '../_components/user-context';

/**
 * Username entry screen (idea.md §0). Submitting create-or-fetches the user and
 * activates the session; an already–signed-in visitor is bounced to the app.
 */
export default function LoginPage(): JSX.Element {
  const { username, status, signIn } = useUser();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in → don't show the entry screen.
  useEffect(() => {
    if (status === 'ready' && username) {
      router.replace('/');
    }
  }, [status, username, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Please enter a username.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signIn(trimmed);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <main className="screen">
      <form className="card" onSubmit={handleSubmit}>
        <h1 className="title">🍳 Recipe Tracker</h1>
        <p className="subtitle">Enter a username to get cooking. We&rsquo;ll create it if it&rsquo;s new.</p>

        <label className="field">
          <span className="field-label">Username</span>
          <input
            className="input"
            type="text"
            name="username"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. chef_drew"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            maxLength={50}
            autoFocus
            disabled={submitting}
            aria-invalid={error ? true : undefined}
          />
        </label>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="button" type="submit" disabled={submitting || value.trim().length === 0}>
          {submitting ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
