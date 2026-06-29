'use client';

import { useEffect, useState } from 'react';

import type { RecipeDetail, RecipeSummary } from '@application/types';

import { RecipeCard } from '../RecipeCard';
import { Button } from '../ui/Button';
import { useUser } from '../user-context';
import { GuidedCook } from './GuidedCook';

/**
 * Cook tab orchestrator (idea.md §3). Owns the path from the big COOK button to
 * an in-progress guided cook: pick a recipe → load its full contents → hand off
 * to {@link GuidedCook}. Keeps the interface layer free of infrastructure — all
 * data comes through the `/api/recipes` routes.
 */

type Phase =
  | { status: 'idle' }
  | { status: 'picking' }
  | { status: 'starting'; recipeId: string }
  | { status: 'cooking'; recipe: RecipeDetail };

type ListState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; recipes: RecipeSummary[] };

export function CookExperience(): JSX.Element {
  const { username } = useUser();
  const [phase, setPhase] = useState<Phase>({ status: 'idle' });
  const [list, setList] = useState<ListState>({ status: 'loading' });
  const [startError, setStartError] = useState<string | null>(null);

  // Load the user's recipes whenever the picker opens, so "Times cooked" stays
  // fresh after each completed cook.
  useEffect(() => {
    if (phase.status !== 'picking' || !username) {
      return;
    }
    let cancelled = false;
    setList({ status: 'loading' });

    fetch(`/api/recipes?username=${encodeURIComponent(username)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load recipes');
        }
        const body = (await response.json()) as { recipes: RecipeSummary[] };
        if (!cancelled) {
          setList({ status: 'ready', recipes: body.recipes });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setList({ status: 'error' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [phase.status, username]);

  // Once a recipe is chosen, load its full contents before starting the cook.
  useEffect(() => {
    if (phase.status !== 'starting' || !username) {
      return;
    }
    let cancelled = false;
    const { recipeId } = phase;

    fetch(`/api/recipes/${recipeId}?username=${encodeURIComponent(username)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load recipe');
        }
        const body = (await response.json()) as { recipe: RecipeDetail };
        if (!cancelled) {
          setPhase({ status: 'cooking', recipe: body.recipe });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStartError('We couldn’t start that cook. Please try again.');
          setPhase({ status: 'picking' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [phase, username]);

  if (phase.status === 'cooking') {
    return (
      <GuidedCook
        recipe={phase.recipe}
        username={username ?? ''}
        onExit={() => setPhase({ status: 'idle' })}
      />
    );
  }

  if (phase.status === 'starting') {
    return <p className="state-note">Getting your recipe ready…</p>;
  }

  if (phase.status === 'picking') {
    return (
      <section className="cook-picker">
        <header className="cook-picker-head">
          <h1 className="tab-title">Pick a recipe</h1>
          <Button variant="ghost" onClick={() => setPhase({ status: 'idle' })}>
            Cancel
          </Button>
        </header>

        {startError && <p className="state-note state-note-error">{startError}</p>}

        {list.status === 'loading' && <p className="state-note">Loading your recipes…</p>}

        {list.status === 'error' && (
          <p className="state-note state-note-error">
            We couldn’t load your recipes right now. Please try again.
          </p>
        )}

        {list.status === 'ready' &&
          (list.recipes.length === 0 ? (
            <div className="recipes-empty">
              <p className="recipes-empty-emoji" aria-hidden="true">
                🍽️
              </p>
              <p className="state-note">Add a recipe first, then come back to cook it!</p>
            </div>
          ) : (
            <ul className="recipe-list">
              {list.recipes.map((recipe) => (
                <li key={recipe.id}>
                  <RecipeCard
                    name={recipe.name}
                    color={recipe.color}
                    icon={recipe.icon}
                    timesCooked={recipe.timesCooked}
                    onClick={() => {
                      setStartError(null);
                      setPhase({ status: 'starting', recipeId: recipe.id });
                    }}
                  />
                </li>
              ))}
            </ul>
          ))}
      </section>
    );
  }

  // Idle: the big, fun COOK entry point (idea.md §3).
  return (
    <section className="tab-page">
      <h1 className="tab-title">Let&rsquo;s Cook</h1>
      <p className="tab-subtitle">Pick a recipe and cook it step by step.</p>
      <button className="cook-button" type="button" onClick={() => setPhase({ status: 'picking' })}>
        COOK
      </button>
    </section>
  );
}
