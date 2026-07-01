import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { CreateRecipeForm } from '../../../../_components/CreateRecipeForm';
import { PasteRecipeForm } from '../../../../_components/PasteRecipeForm';

/**
 * Create-recipe entry point reached from the "+ New Recipe" chooser (idea.md
 * §2). "Create from Scratch" renders the blank-recipe form; "Create using AI"
 * renders the paste-to-structured flow. Anything else falls back to scratch.
 */
export default function NewRecipePage({ params }: { params: { mode: string } }): JSX.Element {
  const isAi = params.mode === 'ai';

  return (
    <section className="create-page">
      <header className="create-page-head">
        <Link className="button button-ghost" href="/recipes">
          <ArrowLeft size={17} strokeWidth={2.2} /> Recipes
        </Link>
        <h1 className="recipes-title">{isAi ? 'Create using AI' : 'New Recipe'}</h1>
      </header>
      {isAi ? <PasteRecipeForm /> : <CreateRecipeForm />}
    </section>
  );
}
