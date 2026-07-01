'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '../ui/Button';

/**
 * The single per-cook notepad (idea.md §3). One notepad is shared across the
 * whole guided cook: the cook can open it from any working stage (ingredients,
 * prep, cook) via the Notes icon and jot anything down. The text is owned by
 * {@link GuidedCook} so it can be frozen onto the immutable cook session on
 * finish and shown later in History.
 *
 * A lightweight modal over the flow — reuses the app's bottom-sheet styling.
 * Closes on Escape, on backdrop click, and on "Done"; nothing is submitted
 * here, the parent simply keeps the latest text.
 */
export function CookNotepad({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (text: string) => void;
  onClose: () => void;
}): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Open focused on the notepad, and close on Escape for keyboard users.
  useEffect(() => {
    textareaRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="sheet-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="cook-notepad-title">
        <div className="cook-notepad-head">
          <h2 id="cook-notepad-title" className="sheet-title">
            Notes
          </h2>
          <button
            type="button"
            className="cook-notepad-close"
            onClick={onClose}
            aria-label="Close notes"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>
        <p className="cook-notepad-hint">
          Jot down anything as you cook — it’s saved with this cook in your history.
        </p>
        <textarea
          ref={textareaRef}
          className="input textarea cook-notepad-input"
          placeholder="e.g. Used half the sugar, and the sauce needed 5 more minutes."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={6}
        />
        <Button block onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
