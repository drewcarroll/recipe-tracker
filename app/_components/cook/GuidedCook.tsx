'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { RecipeDetail } from '@application/types';

import { getRecipeIconGlyph } from '../../_design/icons';
import { getPastel } from '../../_design/palette';
import { Button } from '../ui/Button';
import { NotesForNextTime } from './NotesForNextTime';

/**
 * The guided cook flow (idea.md §3): walk the cook through a single recipe one
 * stage at a time — ingredients check → guided prep → steps one-by-one → a
 * Congrats screen — while timing how long the whole cook takes. On finish it
 * logs an immutable cook session (with the elapsed time) so the cook shows up in
 * History and bumps the recipe's "Times cooked" count. The Congrats screen also
 * collects free-text "notes for next time" and turns them into approvable
 * suggested changes to the recipe (idea.md §3) via {@link NotesForNextTime}.
 */

type Stage = 'ingredients' | 'prep' | 'steps' | 'congrats';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** Order of the three working stages, for the progress indicator. */
const STAGE_ORDER: Record<Exclude<Stage, 'congrats'>, number> = {
  ingredients: 0,
  prep: 1,
  steps: 2,
};

const STAGE_LABELS: ReadonlyArray<{ stage: Exclude<Stage, 'congrats'>; label: string }> = [
  { stage: 'ingredients', label: 'Ingredients' },
  { stage: 'prep', label: 'Prep' },
  { stage: 'steps', label: 'Cook' },
];

/** Format a duration in seconds as `m:ss` (or `h:mm:ss` past an hour). */
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export function GuidedCook({
  recipe,
  username,
  onExit,
}: {
  recipe: RecipeDetail;
  username: string;
  onExit: () => void;
}): JSX.Element {
  const pastel = getPastel(recipe.color);

  const [stage, setStage] = useState<Stage>('ingredients');
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedPrep, setCheckedPrep] = useState<ReadonlySet<string>>(new Set());

  // Elapsed-time tracking. The cook clock starts the moment the guided flow
  // opens (the ingredients check) and freezes when the cook finishes.
  const startedAtRef = useRef<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    if (finalDuration !== null) {
      return;
    }
    const id = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [finalDuration]);

  // Persist the finished cook as an immutable session (idea.md §4): freeze the
  // recipe's contents by value so later edits never rewrite this history entry.
  const logSession = useCallback(
    async (durationSeconds: number): Promise<void> => {
      setSaveState('saving');
      try {
        const response = await fetch('/api/cook-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            recipeId: recipe.id,
            recipeName: recipe.name,
            durationSeconds,
            snapshot: {
              ingredients: recipe.ingredients.map(({ name, quantity, unit }) => ({
                name,
                quantity,
                unit,
              })),
              prep: recipe.prep.map((item) => item.text),
              steps: recipe.steps.map((item) => item.text),
            },
          }),
        });
        setSaveState(response.ok ? 'saved' : 'error');
      } catch {
        setSaveState('error');
      }
    },
    [recipe, username],
  );

  const finish = useCallback((): void => {
    const duration = Math.floor((Date.now() - startedAtRef.current) / 1000);
    setFinalDuration(duration);
    setStage('congrats');
    void logSession(duration);
  }, [logSession]);

  const togglePrep = (id: string): void => {
    setCheckedPrep((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const displaySeconds = finalDuration ?? elapsedSeconds;
  const steps = recipe.steps;

  // --- Congrats screen (idea.md §3, criterion 4) -------------------------- */
  if (stage === 'congrats') {
    return (
      <section className="cook-flow">
        <div className="cook-congrats">
          <div className="cook-congrats-emoji" aria-hidden="true">
            🎉
          </div>
          <h1 className="cook-congrats-title">Nice work!</h1>
          <p className="cook-congrats-sub">
            You finished <strong>{recipe.name}</strong>.
          </p>

          <div className="cook-congrats-time">
            <span className="cook-congrats-time-label">Cook time</span>
            <span className="cook-congrats-time-value">{formatDuration(displaySeconds)}</span>
          </div>

          {saveState === 'saving' && <p className="state-note">Saving to your history…</p>}
          {saveState === 'saved' && <p className="state-note">Saved to your history.</p>}
          {saveState === 'error' && (
            <p className="state-note state-note-error">
              We couldn’t save this cook to your history.
            </p>
          )}

          <NotesForNextTime recipe={recipe} username={username} />

          <Button block onClick={onExit}>
            Done
          </Button>
        </div>
      </section>
    );
  }

  // --- Working stages: shared header + stepper + stage body --------------- */
  return (
    <section className="cook-flow">
      <header className="cook-flow-head">
        <Button variant="ghost" onClick={onExit}>
          ✕ Quit
        </Button>
        <span className="cook-timer" aria-label="Elapsed cook time" role="timer">
          ⏱ {formatDuration(displaySeconds)}
        </span>
      </header>

      <div className="cook-recipe-bar">
        <span
          className="cook-recipe-icon"
          style={{ background: pastel.value, color: pastel.ink }}
          aria-hidden="true"
        >
          {getRecipeIconGlyph(recipe.icon)}
        </span>
        <span className="cook-recipe-name">{recipe.name}</span>
      </div>

      <ol className="cook-stepper" aria-label="Cook progress">
        {STAGE_LABELS.map(({ stage: s, label }) => {
          const order = STAGE_ORDER[s];
          const current = STAGE_ORDER[stage as Exclude<Stage, 'congrats'>];
          const cls = [
            'cook-stepper-item',
            order === current ? 'cook-stepper-current' : '',
            order < current ? 'cook-stepper-done' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={s} className={cls} aria-current={order === current ? 'step' : undefined}>
              {label}
            </li>
          );
        })}
      </ol>

      {stage === 'ingredients' && (
        <>
          <div className="cook-card">
            <h2 className="cook-stage-title">Got everything?</h2>
            <p className="cook-stage-hint">Check you have all the ingredients before you start.</p>
            {recipe.ingredients.length === 0 ? (
              <p className="state-note">No ingredients listed for this recipe.</p>
            ) : (
              <ul className="cook-ingredient-list">
                {recipe.ingredients.map((ing) => {
                  const amount = [ing.quantity, ing.unit].filter(Boolean).join(' ');
                  return (
                    <li key={ing.id} className="cook-ingredient">
                      {amount && <span className="cook-ingredient-amount">{amount}</span>}
                      <span className="cook-ingredient-name">{ing.name}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="cook-actions">
            <Button block onClick={() => setStage('prep')}>
              Next →
            </Button>
          </div>
        </>
      )}

      {stage === 'prep' && (
        <>
          <div className="cook-card">
            <h2 className="cook-stage-title">Prep first</h2>
            <p className="cook-stage-hint">
              Knock out the prep so the cook goes smoothly. Tap each one as you go.
            </p>
            {recipe.prep.length === 0 ? (
              <p className="state-note">No prep needed — straight to cooking!</p>
            ) : (
              <ul className="cook-checklist">
                {recipe.prep.map((item) => {
                  const done = checkedPrep.has(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`cook-check${done ? ' cook-check-done' : ''}`}
                        aria-pressed={done}
                        onClick={() => togglePrep(item.id)}
                      >
                        <span className="cook-check-box" aria-hidden="true">
                          {done ? '✓' : ''}
                        </span>
                        <span className="cook-check-text">{item.text}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="cook-actions">
            <Button variant="secondary" onClick={() => setStage('ingredients')}>
              ← Back
            </Button>
            <Button
              block
              onClick={() => {
                setStepIndex(0);
                setStage('steps');
              }}
            >
              Start cooking →
            </Button>
          </div>
        </>
      )}

      {stage === 'steps' &&
        (steps.length === 0 ? (
          <>
            <div className="cook-card">
              <h2 className="cook-stage-title">No steps yet</h2>
              <p className="cook-stage-hint">This recipe doesn’t have any cook steps.</p>
            </div>
            <div className="cook-actions">
              <Button variant="secondary" onClick={() => setStage('prep')}>
                ← Back
              </Button>
              <Button block onClick={finish}>
                Finish 🎉
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="cook-step-progress">
              <span className="cook-step-count">
                Step {stepIndex + 1} of {steps.length}
              </span>
              <span className="cook-progress-track" aria-hidden="true">
                <span
                  className="cook-progress-fill"
                  style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                />
              </span>
            </div>
            <div className="cook-card cook-step-card">
              <span className="cook-step-number" aria-hidden="true">
                {stepIndex + 1}
              </span>
              <p className="cook-step-text">{steps[stepIndex]?.text}</p>
            </div>
            <div className="cook-actions">
              <Button
                variant="secondary"
                onClick={() => (stepIndex === 0 ? setStage('prep') : setStepIndex((i) => i - 1))}
              >
                ← Back
              </Button>
              {stepIndex === steps.length - 1 ? (
                <Button block onClick={finish}>
                  Finish 🎉
                </Button>
              ) : (
                <Button block onClick={() => setStepIndex((i) => i + 1)}>
                  Next →
                </Button>
              )}
            </div>
          </>
        ))}
    </section>
  );
}
