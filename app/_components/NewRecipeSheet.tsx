'use client';

import { type LucideIcon, Pencil, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useEffect } from 'react';

/**
 * The "+ New Recipe" chooser (idea.md §2). Presents the two ways to create a
 * recipe — from scratch or with AI — as a bottom sheet. Selecting one routes
 * into that create flow; the flows themselves land in later tasks.
 */

interface CreateOption {
  mode: 'scratch' | 'ai';
  Icon: LucideIcon;
  title: string;
  description: string;
}

const OPTIONS: readonly CreateOption[] = [
  {
    mode: 'scratch',
    Icon: Pencil,
    title: 'Create from Scratch',
    description: 'Start with a blank recipe and fill it in yourself.',
  },
  {
    mode: 'ai',
    Icon: Sparkles,
    title: 'Create using AI',
    description: 'Paste in a recipe and let Claude structure it for you.',
  },
];

export function NewRecipeSheet({ onClose }: { onClose: () => void }): JSX.Element {
  const router = useRouter();

  // Close on Escape for keyboard users.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const choose = (mode: CreateOption['mode']): void => {
    router.push(`/recipes/new/${mode}` as Route);
  };

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
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-recipe-sheet-title"
      >
        <h2 id="new-recipe-sheet-title" className="sheet-title">
          New Recipe
        </h2>
        <div className="sheet-options">
          {OPTIONS.map((option) => (
            <button
              key={option.mode}
              type="button"
              className="sheet-option"
              onClick={() => choose(option.mode)}
            >
              <span className="sheet-option-icon" aria-hidden="true">
                <option.Icon size={24} strokeWidth={2} />
              </span>
              <span className="sheet-option-body">
                <span className="sheet-option-title">{option.title}</span>
                <span className="sheet-option-desc">{option.description}</span>
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="button button-secondary button-block" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
