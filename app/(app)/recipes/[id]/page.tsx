'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { IngredientInput, RecipeBasics, RecipeDetail } from '@application/types';

import { IngredientsEditor } from '../../../_components/IngredientsEditor';
import { RecipeBasicsEditor } from '../../../_components/RecipeBasicsEditor';
import { TextListEditor } from '../../../_components/TextListEditor';
import { Spinner } from '../../../_components/ui/Spinner';
import { useUser } from '../../../_components/user-context';

/**
 * Recipe detail / editor page (idea.md §2). Loads a recipe with its contents
 * and renders the three editable sections — Ingredients, Prep, Steps — each of
 * which saves itself back to Supabase through the `/api/recipes/[id]/*` routes.
 * The interface layer never touches infrastructure directly.
 */

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'notfound' }
  | { status: 'ready'; recipe: RecipeDetail };

export default function RecipeDetailPage(): JSX.Element {
  const { username } = useUser();
  const params = useParams<{ id: string }>();
  const recipeId = params.id;
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!username) {
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });

    fetch(`/api/recipes/${recipeId}?username=${encodeURIComponent(username)}`)
      .then(async (response) => {
        if (response.status === 404) {
          if (!cancelled) setState({ status: 'notfound' });
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to load recipe');
        }
        const body = (await response.json()) as { recipe: RecipeDetail };
        if (!cancelled) setState({ status: 'ready', recipe: body.recipe });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [username, recipeId]);

  // Save helper shared by the three sections: PUT the whole list, throwing on
  // failure so the editor can surface its error state.
  const saveSection = useCallback(
    async (section: 'ingredients' | 'prep' | 'steps', items: unknown): Promise<void> => {
      const response = await fetch(`/api/recipes/${recipeId}/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, items }),
      });
      if (!response.ok) {
        throw new Error('Save failed');
      }
    },
    [recipeId, username],
  );

  if (state.status === 'loading') {
    return <Spinner label="Loading recipe…" />;
  }

  if (state.status === 'notfound') {
    return (
      <div className="recipes-empty">
        <p className="state-note">That recipe couldn’t be found.</p>
        <Link className="button button-secondary" href="/recipes">
          Back to recipes
        </Link>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <p className="state-note state-note-error">
        We couldn’t load this recipe right now. Please try again.
      </p>
    );
  }

  const { recipe } = state;

  // Reflect a saved basic-info edit in local state without a full reload.
  const applyBasics = (basics: RecipeBasics): void => {
    setState({ status: 'ready', recipe: { ...recipe, ...basics } });
  };

  return (
    <div className="recipe-detail">
      <header className="recipe-detail-head">
        <Link className="button button-ghost recipe-detail-back" href="/recipes">
          <ArrowLeft size={17} strokeWidth={2.2} /> Recipes
        </Link>
        <RecipeBasicsEditor
          recipeId={recipe.id}
          username={username}
          name={recipe.name}
          color={recipe.color}
          icon={recipe.icon}
          onSaved={applyBasics}
        />
      </header>

      <IngredientsEditor
        initial={recipe.ingredients}
        onSave={(items: IngredientInput[]) => saveSection('ingredients', items)}
      />

      <TextListEditor
        title="Prep"
        initial={recipe.prep}
        onSave={(items) => saveSection('prep', items)}
        addLabel="+ Add prep task"
        placeholder="e.g. Chop the onions"
        reorderable
        emptyNote="No prep tasks yet."
      />

      <TextListEditor
        title="Steps"
        initial={recipe.steps}
        onSave={(items) => saveSection('steps', items)}
        addLabel="+ Add step"
        placeholder="Describe this step"
        ordered
        reorderable
        emptyNote="No steps yet."
      />
    </div>
  );
}
