import Link from 'next/link';

import { CreateRecipeForm } from '../../../../_components/CreateRecipeForm';

/**
 * Create-recipe entry point reached from the "+ New Recipe" chooser (idea.md
 * §2). "Create from Scratch" renders the blank-recipe form; "Create using AI"
 * is built in a later task and stays a placeholder for now.
 */
export default function NewRecipePage({ params }: { params: { mode: string } }): JSX.Element {
  if (params.mode === 'scratch') {
    return (
      <section className="create-page">
        <header className="create-page-head">
          <Link className="button button-ghost" href="/recipes">
            ← Recipes
          </Link>
          <h1 className="recipes-title">New Recipe</h1>
        </header>
        <CreateRecipeForm />
      </section>
    );
  }

  return (
    <section className="tab-page">
      <h1 className="tab-title">Create using AI</h1>
      <p className="tab-subtitle">Paste a recipe and let Claude structure it — coming soon.</p>
      <Link className="button button-secondary" href="/recipes">
        Back to recipes
      </Link>
    </section>
  );
}
