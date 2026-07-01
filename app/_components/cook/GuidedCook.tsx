'use client';

import { ArrowLeft, ArrowRight, Check, NotebookPen, PartyPopper, Timer, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { RecipeDetail } from '@application/types';

import { getPastel } from '../../_design/palette';
import { RecipeIcon } from '../RecipeIcon';
import { Button } from '../ui/Button';
import { CookNotepad } from './CookNotepad';
import { NotesForNextTime } from './NotesForNextTime';

/**
 * The guided cook flow (idea.md §3): walk the cook through a single recipe one
 * stage at a time — ingredients check → guided prep → steps one-by-one → a
 * Congrats screen — while timing how long the whole cook takes. Along the way
 * the cook can open a single notepad (the Notes icon, available on every
 * working stage) to jot anything down, and on the Congrats screen write "notes
 * for next time".
 *
 * When the cook leaves the flow ("Done"), it writes a single IMMUTABLE cook
 * session (idea.md §4): the recipe's contents frozen by value as a snapshot,
 * the cook notes, the notes, the elapsed duration and a timestamp. Storing it
 * by value keeps it independent of the live recipe rows, so later edits —
 * including AI-approved suggestions from {@link NotesForNextTime} — never alter
 * this history entry. The saved session shows up in History and bumps the
 * recipe's "Times cooked" count.
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

  // Captured during the cook and folded into the session on finish. Cook notes
  // come from the single in-cook notepad, opened from any working stage; notes
  // are written on the congrats screen (and double as the source for "notes for
  // next time").
  const [cookNotes, setCookNotes] = useState('');
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [notes, setNotes] = useState('');

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

  const finish = useCallback((): void => {
    const duration = Math.floor((Date.now() - startedAtRef.current) / 1000);
    setFinalDuration(duration);
    setStage('congrats');
  }, []);

  // Persist the finished cook as a single IMMUTABLE session (idea.md §4): the
  // recipe's contents frozen by value (independent of the live rows), plus the
  // cook notes, notes, duration and timestamp. Written once, when the cook
  // leaves the flow. Returns whether the save succeeded.
  const persistSession = useCallback(async (): Promise<boolean> => {
    setSaveState('saving');
    try {
      const response = await fetch('/api/cook-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          recipeId: recipe.id,
          recipeName: recipe.name,
          durationSeconds: finalDuration ?? 0,
          cookNotes: cookNotes.trim(),
          notes: notes.trim(),
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
      if (!response.ok) {
        throw new Error('Save failed');
      }
      setSaveState('saved');
      return true;
    } catch {
      setSaveState('error');
      return false;
    }
  }, [recipe, username, finalDuration, cookNotes, notes]);

  // "Done": save the session (once), then leave the flow. On failure we keep
  // the user on the congrats screen so they can retry rather than lose the cook.
  const handleDone = useCallback(async (): Promise<void> => {
    if (saveState === 'saving') {
      return;
    }
    if (saveState === 'saved') {
      onExit();
      return;
    }
    if (await persistSession()) {
      onExit();
    }
  }, [saveState, persistSession, onExit]);

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
            <PartyPopper size={40} strokeWidth={1.9} />
          </div>
          <h1 className="cook-congrats-title">Nice work!</h1>
          <p className="cook-congrats-sub">
            You finished <strong>{recipe.name}</strong>.
          </p>

          <div className="cook-congrats-time">
            <span className="cook-congrats-time-label">Cook time</span>
            <span className="cook-congrats-time-value">{formatDuration(displaySeconds)}</span>
          </div>

          {cookNotes.trim().length > 0 && (
            <div className="cook-congrats-notes">
              <span className="cook-congrats-notes-label">Notes</span>
              <p className="cook-congrats-notes-text">{cookNotes.trim()}</p>
            </div>
          )}

          <NotesForNextTime
            recipe={recipe}
            username={username}
            notes={notes}
            onNotesChange={setNotes}
          />

          {saveState === 'error' && (
            <p className="state-note state-note-error">
              We couldn’t save this cook to your history. Please try again.
            </p>
          )}

          <Button block onClick={() => void handleDone()} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Try again' : 'Done'}
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
          <X size={18} strokeWidth={2.2} /> Quit
        </Button>
        <div className="cook-flow-head-right">
          <button
            type="button"
            className={`cook-notes-button${cookNotes.trim().length > 0 ? ' cook-notes-button-filled' : ''}`}
            onClick={() => setNotepadOpen(true)}
            aria-label={cookNotes.trim().length > 0 ? 'Edit notes' : 'Add notes'}
          >
            <NotebookPen size={18} strokeWidth={2.2} />
          </button>
          <span className="cook-timer" aria-label="Elapsed cook time" role="timer">
            <Timer size={18} strokeWidth={2.2} /> {formatDuration(displaySeconds)}
          </span>
        </div>
      </header>

      <div className="cook-recipe-bar">
        <span
          className="cook-recipe-icon"
          style={{ background: pastel.value, color: pastel.ink }}
          aria-hidden="true"
        >
          <RecipeIcon icon={recipe.icon} size={24} />
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
              Next <ArrowRight size={18} strokeWidth={2.2} />
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
                          {done ? <Check size={16} strokeWidth={3} /> : ''}
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
              <ArrowLeft size={18} strokeWidth={2.2} /> Back
            </Button>
            <Button
              block
              onClick={() => {
                setStepIndex(0);
                setStage('steps');
              }}
            >
              Start cooking <ArrowRight size={18} strokeWidth={2.2} />
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
                <ArrowLeft size={18} strokeWidth={2.2} /> Back
              </Button>
              <Button block onClick={finish}>
                Finish <PartyPopper size={18} strokeWidth={2.2} />
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
                <ArrowLeft size={18} strokeWidth={2.2} /> Back
              </Button>
              {stepIndex === steps.length - 1 ? (
                <Button block onClick={finish}>
                  Finish <PartyPopper size={18} strokeWidth={2.2} />
                </Button>
              ) : (
                <Button block onClick={() => setStepIndex((i) => i + 1)}>
                  Next <ArrowRight size={18} strokeWidth={2.2} />
                </Button>
              )}
            </div>
          </>
        ))}

      {notepadOpen && (
        <CookNotepad value={cookNotes} onChange={setCookNotes} onClose={() => setNotepadOpen(false)} />
      )}
    </section>
  );
}
