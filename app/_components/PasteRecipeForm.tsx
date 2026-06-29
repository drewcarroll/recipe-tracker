'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { RecipeSummary } from '@application/types';

import { Button } from './ui/Button';
import { useUser } from './user-context';

/**
 * "Create using AI" form (idea.md §2): paste a recipe, send it to the backend
 * route that runs Claude, and land on the new recipe's detail/editor page once
 * it's saved. The model call lives entirely behind the API route, so the
 * Anthropic key never reaches the browser.
 */
export function PasteRecipeForm(): JSX.Element {
  const { username } = useUser();
  const router = useRouter();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = text.trim().length > 0 && !submitting;

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/recipes/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, text: text.trim() }),
      });
      if (!response.ok) {
        throw new Error('Convert failed');
      }
      const { recipe } = (await response.json()) as { recipe: RecipeSummary };
      // Open the freshly-parsed recipe in its editor so the user can tweak it.
      router.replace(`/recipes/${recipe.id}` as Route);
    } catch {
      setError('We couldn’t turn that into a recipe. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form className="create-form" onSubmit={submit}>
      <div className="field">
        <label className="field-label" htmlFor="recipe-text">
          Paste in the recipe…
        </label>
        <textarea
          id="recipe-text"
          className="input textarea"
          value={text}
          placeholder="Paste a full recipe — ingredients, prep, and steps. We’ll structure it for you."
          rows={12}
          autoFocus
          disabled={submitting}
          onChange={(event) => setText(event.target.value)}
        />
      </div>

      {error && <p className="error">{error}</p>}

      <Button type="submit" block disabled={!canSubmit}>
        {submitting ? 'Converting…' : 'Convert with AI'}
      </Button>

      {submitting && (
        <p className="state-note" aria-live="polite">
          Reading your recipe and structuring it… this can take a few seconds.
        </p>
      )}
    </form>
  );
}
