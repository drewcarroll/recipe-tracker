'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { RecipeDTO } from '@application/dtos/RecipeDTO';
import { themeForRecipe } from '../recipeTheme';

type LoadState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; recipe: RecipeDTO };

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    fetch(`/api/recipes/${params.id}`)
      .then(async (res) => {
        if (res.status === 404) {
          if (active) setState({ status: 'not-found' });
          return;
        }
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const recipe = (await res.json()) as RecipeDTO;
        if (active) setState({ status: 'ready', recipe });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <main>
      <Link href="/recipes" className="back-link">
        ← Your Recipes
      </Link>

      {state.status === 'loading' && <p className="recipes-status">Loading…</p>}

      {state.status === 'not-found' && <p className="recipes-status">That recipe doesn’t exist.</p>}

      {state.status === 'error' && (
        <p className="recipes-status">Sorry, we couldn’t load this recipe. Please try again.</p>
      )}

      {state.status === 'ready' && <RecipeDetail recipe={state.recipe} />}
    </main>
  );
}

function RecipeDetail({ recipe }: { recipe: RecipeDTO }) {
  const theme = themeForRecipe(recipe.id);
  return (
    <>
      <header className="recipe-detail__header" style={{ backgroundColor: theme.color }}>
        <span className="recipe-detail__icon" aria-hidden="true">
          {theme.icon}
        </span>
        <div>
          <h1 className="recipe-detail__title">{recipe.title}</h1>
          <p className="recipe-detail__meta">Times cooked: {recipe.timesCooked}</p>
        </div>
      </header>

      {recipe.description && <p>{recipe.description}</p>}

      <dl className="recipe-detail__facts">
        <div>
          <dt>Servings</dt>
          <dd>{recipe.servings}</dd>
        </div>
        <div>
          <dt>Prep</dt>
          <dd>{recipe.prepTimeMinutes} min</dd>
        </div>
        <div>
          <dt>Cook</dt>
          <dd>{recipe.cookTimeMinutes} min</dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd>{recipe.difficulty}</dd>
        </div>
      </dl>

      <h2>Ingredients</h2>
      <ul>
        {recipe.ingredients.map((ingredient, index) => (
          <li key={`${ingredient.name}-${index}`}>
            {ingredient.quantity} {ingredient.unit} {ingredient.name}
          </li>
        ))}
      </ul>

      <h2>Steps</h2>
      <ol>
        {recipe.steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </>
  );
}
