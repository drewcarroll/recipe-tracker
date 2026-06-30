'use client';

import { useEffect, useState } from 'react';

import type { CookSession } from '@application/types';

import { CookSessionCard } from '../../_components/CookSessionCard';
import { Spinner } from '../../_components/ui/Spinner';
import { useUser } from '../../_components/user-context';

/**
 * History tab (idea.md §4): the list of past cook sessions, most recent first,
 * each showing its immutable snapshot (recipe name, deviations, notes, time
 * taken, timestamp). Sessions can be deleted from here; because a recipe's
 * "Times cooked" count is derived from its session count, deleting one makes
 * that count tick back down the next time the Recipes tab loads.
 *
 * Data is read/mutated through the `/api/cook-sessions` routes (which run the
 * use cases), keeping this interface layer free of any direct infrastructure
 * access.
 */

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; sessions: CookSession[] };

export default function HistoryPage(): JSX.Element {
  const { username } = useUser();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });

    fetch(`/api/cook-sessions?username=${encodeURIComponent(username)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load cook history');
        }
        const body = (await response.json()) as { sessions: CookSession[] };
        if (!cancelled) {
          setState({ status: 'ready', sessions: body.sessions });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'error' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const deleteSession = async (sessionId: string): Promise<void> => {
    if (!username || deletingId) {
      return;
    }
    setDeletingId(sessionId);
    try {
      const response = await fetch(
        `/api/cook-sessions/${sessionId}?username=${encodeURIComponent(username)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      setState((prev) =>
        prev.status === 'ready'
          ? { status: 'ready', sessions: prev.sessions.filter((s) => s.id !== sessionId) }
          : prev,
      );
    } catch {
      // Leave the card in place; the user can retry.
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="history-page">
      <header className="history-head">
        <h1 className="history-title">Cook History</h1>
      </header>

      {state.status === 'loading' && <Spinner label="Loading your cook history…" />}

      {state.status === 'error' && (
        <p className="state-note state-note-error">
          We couldn’t load your cook history right now. Please try again.
        </p>
      )}

      {state.status === 'ready' &&
        (state.sessions.length === 0 ? (
          <div className="recipes-empty">
            <p className="recipes-empty-emoji" aria-hidden="true">
              🕑
            </p>
            <p className="state-note">No cooks yet. Finish a guided cook and it’ll show up here.</p>
          </div>
        ) : (
          <ul className="session-list">
            {state.sessions.map((session) => (
              <li key={session.id}>
                <CookSessionCard
                  session={session}
                  onDelete={() => deleteSession(session.id)}
                  deleting={deletingId === session.id}
                />
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
