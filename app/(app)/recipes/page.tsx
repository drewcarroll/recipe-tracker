'use client';

import { useEffect, useState } from 'react';

import type { RecipeSummary } from '@application/types';

import { NewRecipeSheet } from '../../_components/NewRecipeSheet';
import { RecipeCard } from '../../_components/RecipeCard';
import { Button } from '../../_components/ui/Button';
import { useUser } from '../../_components/user-context';

/**
 * Recipes tab (idea.md §2): the "Your Recipes" vertical list of cards — each
 * with name, pastel color, icon and a derived "Times cooked" count — plus a
 * "+ New Recipe" button that opens the create-options chooser.
 *
 * Data is read through the `/api/recipes` route (which runs the use case),
 * keeping this interface layer free of any direct infrastructure access.
 */

type LoadState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; recipes: RecipeSummary[] };

export default function RecipesPage(): JSX.Element {
  const { username } = useUser();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    if (!username) {
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });

    fetch(`/api/recipes?username=${encodeURIComponent(username)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load recipes');
        }
        const body = (await response.json()) as { recipes: RecipeSummary[] };
        if (!cancelled) {
          setState({ status: 'ready', recipes: body.recipes });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'error' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <section className="recipes-page">
      <header className="recipes-head">
        <h1 className="recipes-title">Your Recipes</h1>
        <Button onClick={() => setChoosing(true)}>+ New Recipe</Button>
      </header>

      {state.status === 'loading' && <p className="state-note">Loading your recipes…</p>}

      {state.status === 'error' && (
        <p className="state-note state-note-error">
          We couldn’t load your recipes right now. Please try again.
        </p>
      )}

      {state.status === 'ready' &&
        (state.recipes.length === 0 ? (
          <div className="recipes-empty">
            <p className="recipes-empty-emoji" aria-hidden="true">
              🍽️
            </p>
            <p className="state-note">No recipes yet. Add your first one to get cooking!</p>
          </div>
        ) : (
          <ul className="recipe-list">
            {state.recipes.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard
                  name={recipe.name}
                  color={recipe.color}
                  icon={recipe.icon}
                  timesCooked={recipe.timesCooked}
                />
              </li>
            ))}
          </ul>
        ))}

      {choosing && <NewRecipeSheet onClose={() => setChoosing(false)} />}
    </section>
  );
}
