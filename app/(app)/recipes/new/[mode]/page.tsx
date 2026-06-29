import Link from 'next/link';

/**
 * Create-recipe entry point reached from the "+ New Recipe" chooser (idea.md
 * §2). The two flows — "Create from Scratch" and "Create using AI" — are built
 * in later tasks; this is the routed placeholder that confirms the chooser
 * lands in the right place.
 */

const SCRATCH = {
  title: 'Create from Scratch',
  subtitle: 'A blank recipe editor will live here.',
} as const;

const COPY: Record<string, { title: string; subtitle: string }> = {
  scratch: SCRATCH,
  ai: {
    title: 'Create using AI',
    subtitle: 'Paste a recipe and let Claude structure it — coming soon.',
  },
};

export default function NewRecipePage({ params }: { params: { mode: string } }): JSX.Element {
  const copy = COPY[params.mode] ?? SCRATCH;

  return (
    <section className="tab-page">
      <h1 className="tab-title">{copy.title}</h1>
      <p className="tab-subtitle">{copy.subtitle}</p>
      <Link className="button button-secondary" href="/recipes">
        Back to recipes
      </Link>
    </section>
  );
}
