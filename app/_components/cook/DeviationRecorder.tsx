'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/Button';

/**
 * In-the-moment deviation capture during a guided cook (idea.md §3): "the user
 * can record doing something differently (e.g. 'used less X')". Deviations are
 * collected here and bundled into the immutable cook session when the cook
 * finishes — they describe what was actually cooked, and are not bound to the
 * live recipe.
 *
 * Controlled by the parent flow: the list lives in {@link GuidedCook} so it can
 * be persisted on finish; this component only adds to / removes from it.
 */
export function DeviationRecorder({
  deviations,
  onAdd,
  onRemove,
}: {
  deviations: readonly string[];
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
}): JSX.Element {
  const [draft, setDraft] = useState('');

  const commit = (): void => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    onAdd(trimmed);
    setDraft('');
  };

  return (
    <section className="cook-deviations">
      <h2 className="cook-deviations-title">Did something differently?</h2>
      <p className="cook-deviations-hint">
        Jot down any changes you made — they’re saved with this cook, not the recipe.
      </p>

      {deviations.length > 0 && (
        <ul className="cook-deviation-list">
          {deviations.map((deviation, index) => (
            <li key={index} className="cook-deviation-item">
              <span className="cook-deviation-text">{deviation}</span>
              <button
                type="button"
                className="cook-deviation-remove"
                onClick={() => onRemove(index)}
                aria-label={`Remove "${deviation}"`}
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="cook-deviation-add">
        <input
          className="input cook-deviation-input"
          placeholder="e.g. Used half the sugar"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
          }}
        />
        <Button variant="secondary" onClick={commit} disabled={draft.trim().length === 0}>
          Add
        </Button>
      </div>
    </section>
  );
}
