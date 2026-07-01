'use client';

import { Timer } from 'lucide-react';
import { useState } from 'react';

import type { CookSession } from '@application/types';

import { Button } from './ui/Button';

/**
 * One entry in the Cook History list (idea.md §4): the frozen snapshot of a
 * past cook — recipe name, when it happened, how long it took, any deviations
 * and post-cook notes — plus a delete control. Purely presentational; deletion
 * is handed up to the History page via `onDelete` so the data flow stays in one
 * place.
 */

/** Format a duration in seconds as `m:ss` (or `h:mm:ss` past an hour). */
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Format an ISO timestamp as a friendly absolute date + time. */
function formatCookedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function CookSessionCard({
  session,
  onDelete,
  deleting = false,
}: {
  session: CookSession;
  /** Delete this session; the page owns the request and list update. */
  onDelete: () => void;
  /** True while the delete request for this session is in flight. */
  deleting?: boolean;
}): JSX.Element {
  const [confirming, setConfirming] = useState(false);

  const { snapshot, deviations, notes } = session;
  const summaryParts = [
    `${snapshot.ingredients.length} ingredient${snapshot.ingredients.length === 1 ? '' : 's'}`,
    `${snapshot.steps.length} step${snapshot.steps.length === 1 ? '' : 's'}`,
  ];

  return (
    <article className="session-card">
      <header className="session-card-head">
        <div className="session-card-headings">
          <h2 className="session-card-name">{session.recipeName}</h2>
          <p className="session-card-meta">
            <time dateTime={session.cookedAt}>{formatCookedAt(session.cookedAt)}</time>
            <span aria-hidden="true"> · </span>
            <span className="session-card-duration">
              <Timer size={14} strokeWidth={2.2} /> {formatDuration(session.durationSeconds)}
            </span>
          </p>
        </div>

        {confirming ? (
          <div className="session-card-confirm">
            <Button
              variant="secondary"
              className="button-danger"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Confirm'}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="session-card-delete"
            onClick={() => setConfirming(true)}
            aria-label={`Delete cook session for ${session.recipeName}`}
          >
            Delete
          </Button>
        )}
      </header>

      <p className="session-card-summary">{summaryParts.join(' · ')}</p>

      {deviations.length > 0 && (
        <div className="session-card-section">
          <h3 className="session-card-section-title">Deviations</h3>
          <ul className="session-card-deviations">
            {deviations.map((deviation, index) => (
              <li key={index}>{deviation}</li>
            ))}
          </ul>
        </div>
      )}

      {notes.trim().length > 0 && (
        <div className="session-card-section">
          <h3 className="session-card-section-title">Notes for next time</h3>
          <p className="session-card-notes">{notes}</p>
        </div>
      )}
    </article>
  );
}
