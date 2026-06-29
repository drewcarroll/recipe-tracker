'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { RecipeSummary } from '@application/types';

import { ColorPicker } from './ColorPicker';
import { IconPicker } from './IconPicker';
import { RecipeCard } from './RecipeCard';
import { Button } from './ui/Button';
import { useUser } from './user-context';
import { DEFAULT_ICON_KEY } from '../_design/icons';
import { DEFAULT_PASTEL_KEY } from '../_design/palette';

/**
 * "Create from Scratch" form (idea.md §2): pick a name, color, and icon, save a
 * blank recipe, then land on its detail/editor page to fill in the rest. Posts
 * to `/api/recipes`, keeping this interface layer free of infrastructure.
 */
export function CreateRecipeForm(): JSX.Element {
  const { username } = useUser();
  const router = useRouter();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_PASTEL_KEY);
  const [icon, setIcon] = useState<string>(DEFAULT_ICON_KEY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !submitting;

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name: trimmedName, color, icon }),
      });
      if (!response.ok) {
        throw new Error('Create failed');
      }
      const { recipe } = (await response.json()) as { recipe: RecipeSummary };
      // Open the new recipe in its detail/editor view.
      router.replace(`/recipes/${recipe.id}` as Route);
    } catch {
      setError('We couldn’t create your recipe. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form className="create-form" onSubmit={submit}>
      <div className="field">
        <label className="field-label" htmlFor="recipe-name">
          Name
        </label>
        <input
          id="recipe-name"
          className="input"
          value={name}
          placeholder="e.g. Weeknight pasta"
          autoFocus
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="field">
        <span className="field-label">Color</span>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="field">
        <span className="field-label">Icon</span>
        <IconPicker value={icon} onChange={setIcon} />
      </div>

      <div className="field">
        <span className="field-label">Preview</span>
        <RecipeCard name={trimmedName || 'New recipe'} color={color} icon={icon} timesCooked={0} />
      </div>

      {error && <p className="error">{error}</p>}

      <Button type="submit" block disabled={!canSubmit}>
        {submitting ? 'Creating…' : 'Create recipe'}
      </Button>
    </form>
  );
}
