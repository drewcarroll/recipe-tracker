'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';

import type { RecipeDetail, RecipeSuggestion } from '@application/types';

import { Button } from '../ui/Button';

/**
 * "Notes for next time" (idea.md §3). Shown on the congrats screen once a cook
 * finishes: the cook writes free-text notes, submits them to the backend, and
 * Claude returns suggested changes to the recipe. Each suggestion gets its own
 * Approve / Reject — approving applies it directly to the live recipe (via the
 * backend), rejecting discards it. Approved edits never touch history: the cook
 * session is an immutable snapshot persisted when the flow finishes (idea.md §4).
 *
 * The notes text is owned by the parent flow (a controlled value) so the same
 * notes are saved onto the cook session, not just turned into suggestions.
 *
 * Interface-layer only: all work goes through the `/api/recipes/[id]` routes,
 * so no infrastructure or business logic leaks in here.
 */

type Decision = 'pending' | 'approved' | 'rejected' | 'failed';

interface SuggestionItem {
  suggestion: RecipeSuggestion;
  decision: Decision;
}

type Phase =
  { status: 'editing' } | { status: 'loading' } | { status: 'ready'; items: SuggestionItem[] };

/** A short "Action · Section" badge so each suggestion's scope is obvious. */
const KIND_META: Record<RecipeSuggestion['kind'], { action: string; section: string }> = {
  rename: { action: 'Rename', section: 'Recipe' },
  'add-ingredient': { action: 'Add', section: 'Ingredients' },
  'update-ingredient': { action: 'Change', section: 'Ingredients' },
  'remove-ingredient': { action: 'Remove', section: 'Ingredients' },
  'add-prep': { action: 'Add', section: 'Prep' },
  'update-prep': { action: 'Change', section: 'Prep' },
  'remove-prep': { action: 'Remove', section: 'Prep' },
  'add-step': { action: 'Add', section: 'Steps' },
  'update-step': { action: 'Change', section: 'Steps' },
  'remove-step': { action: 'Remove', section: 'Steps' },
};

export function NotesForNextTime({
  recipe,
  username,
  notes,
  onNotesChange,
}: {
  recipe: RecipeDetail;
  username: string;
  /** Controlled notes text, owned by the parent so it can be saved on finish. */
  notes: string;
  onNotesChange: (notes: string) => void;
}): JSX.Element {
  const [phase, setPhase] = useState<Phase>({ status: 'editing' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  // A single in-flight lock: applying changes one at a time keeps each apply
  // building on the previous result (no races on the same recipe).
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);

  const canSubmit = notes.trim().length > 0 && username.length > 0;

  async function submitNotes(): Promise<void> {
    if (!canSubmit) {
      return;
    }
    setSubmitError(null);
    setPhase({ status: 'loading' });
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, notes: notes.trim() }),
      });
      if (!response.ok) {
        throw new Error('Request failed');
      }
      const body = (await response.json()) as { suggestions: RecipeSuggestion[] };
      setPhase({
        status: 'ready',
        items: body.suggestions.map((suggestion) => ({ suggestion, decision: 'pending' })),
      });
    } catch {
      setSubmitError('We couldn’t turn those notes into suggestions. Please try again.');
      setPhase({ status: 'editing' });
    }
  }

  function setDecision(index: number, decision: Decision): void {
    setPhase((prev) =>
      prev.status === 'ready'
        ? {
            status: 'ready',
            items: prev.items.map((item, i) => (i === index ? { ...item, decision } : item)),
          }
        : prev,
    );
  }

  async function approve(index: number, suggestion: RecipeSuggestion): Promise<void> {
    if (applyingIndex !== null) {
      return;
    }
    setApplyingIndex(index);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/suggestions/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, suggestion }),
      });
      if (!response.ok) {
        throw new Error('Apply failed');
      }
      setDecision(index, 'approved');
    } catch {
      setDecision(index, 'failed');
    } finally {
      setApplyingIndex(null);
    }
  }

  // --- Editing: the notes textarea ---------------------------------------- */
  if (phase.status === 'editing' || phase.status === 'loading') {
    const loading = phase.status === 'loading';
    return (
      <section className="cook-notes">
        <h2 className="cook-notes-title">Notes for next time</h2>
        <p className="cook-notes-hint">
          Jot down what you’d tweak — we’ll suggest changes you can apply to this recipe.
        </p>
        <textarea
          className="input textarea cook-notes-input"
          placeholder="e.g. A bit too salty, and it needed 5 more minutes in the oven."
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          disabled={loading}
          rows={4}
        />
        {submitError && <p className="state-note state-note-error">{submitError}</p>}
        <Button block onClick={() => void submitNotes()} disabled={!canSubmit || loading}>
          {loading ? 'Thinking…' : 'Get suggestions'}
        </Button>
      </section>
    );
  }

  // --- Ready: the suggestions list ---------------------------------------- */
  if (phase.items.length === 0) {
    return (
      <section className="cook-notes">
        <h2 className="cook-notes-title">Notes for next time</h2>
        <p className="state-note">No changes suggested from those notes.</p>
        <Button
          variant="secondary"
          onClick={() => {
            onNotesChange('');
            setPhase({ status: 'editing' });
          }}
        >
          Write new notes
        </Button>
      </section>
    );
  }

  const undecided = phase.items.some((item) => item.decision === 'pending');

  return (
    <section className="cook-notes">
      <h2 className="cook-notes-title">Suggested changes</h2>
      <p className="cook-notes-hint">
        Approve a change to apply it to this recipe. Your cook history stays as it was.
      </p>
      <ul className="cook-suggestion-list">
        {phase.items.map((item, index) => {
          const meta = KIND_META[item.suggestion.kind];
          const isApplying = applyingIndex === index;
          const locked = applyingIndex !== null;
          return (
            <li key={index} className={`cook-suggestion cook-suggestion-${item.decision}`}>
              <div className="cook-suggestion-body">
                <span className="cook-suggestion-badge">
                  {meta.action} · {meta.section}
                </span>
                <span className="cook-suggestion-summary">{item.suggestion.summary}</span>
              </div>

              {item.decision === 'pending' && (
                <div className="cook-suggestion-actions">
                  <Button
                    variant="secondary"
                    onClick={() => setDecision(index, 'rejected')}
                    disabled={locked}
                  >
                    Reject
                  </Button>
                  <Button onClick={() => void approve(index, item.suggestion)} disabled={locked}>
                    {isApplying ? 'Applying…' : 'Approve'}
                  </Button>
                </div>
              )}

              {item.decision === 'approved' && (
                <span className="cook-suggestion-status cook-suggestion-status-approved">
                  <Check size={15} strokeWidth={3} /> Applied
                </span>
              )}
              {item.decision === 'rejected' && (
                <span className="cook-suggestion-status cook-suggestion-status-rejected">
                  Dismissed
                </span>
              )}
              {item.decision === 'failed' && (
                <div className="cook-suggestion-actions">
                  <span className="cook-suggestion-status cook-suggestion-status-failed">
                    Couldn’t apply
                  </span>
                  <Button onClick={() => void approve(index, item.suggestion)} disabled={locked}>
                    Try again
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!undecided && <p className="state-note">All set — you’ve reviewed every suggestion.</p>}
    </section>
  );
}
