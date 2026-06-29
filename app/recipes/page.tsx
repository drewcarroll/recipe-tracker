'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { RecipeDTO } from '@application/dtos/RecipeDTO';
import { themeForRecipe } from './recipeTheme';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; recipes: RecipeDTO[] };

export default function RecipesPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    fetch('/api/recipes')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json() as Promise<RecipeDTO[]>;
      })
      .then((recipes) => {
        if (active) setState({ status: 'ready', recipes });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <h1>Your Recipes</h1>

      {state.status === 'loading' && <p className="recipes-status">Loading your recipes…</p>}

      {state.status === 'error' && (
        <p className="recipes-status">Sorry, we couldn’t load your recipes. Please try again.</p>
      )}

      {state.status === 'ready' && state.recipes.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__icon" aria-hidden="true">
            🍽️
          </p>
          <p className="empty-state__title">No recipes yet</p>
          <p className="empty-state__hint">
            Recipes you add will show up here. Time to cook something up!
          </p>
        </div>
      )}

      {state.status === 'ready' && state.recipes.length > 0 && (
        <ul className="recipe-list">
          {state.recipes.map((recipe) => {
            const theme = themeForRecipe(recipe.id);
            return (
              <li key={recipe.id}>
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="recipe-card"
                  style={{ backgroundColor: theme.color }}
                >
                  <span className="recipe-card__icon" aria-hidden="true">
                    {theme.icon}
                  </span>
                  <span className="recipe-card__body">
                    <span className="recipe-card__name">{recipe.title}</span>
                    <span className="recipe-card__meta">Times cooked: {recipe.timesCooked}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
