import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Shared request handling for the editable-section save routes (idea.md §2):
 * Ingredients, Prep, and Steps. Each route hands over the matching use-case
 * method; this validates the envelope (`username` + `items` array) and maps
 * failures to the right HTTP status. Not named `route.ts`, so Next does not
 * treat it as an endpoint.
 */

const bodySchema = z.object({
  username: z.string().trim().min(1).max(50),
  items: z.array(z.unknown()),
});

type SaveSection = (username: string, recipeId: string, items: unknown) => Promise<unknown>;

export async function handleSectionSave(
  request: Request,
  recipeId: string,
  save: SaveSection,
): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A username and an items array are required.' },
      { status: 400 },
    );
  }

  try {
    const items = await save(parsed.data.username, recipeId, parsed.data.items);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'One or more items are invalid.' }, { status: 400 });
    }
    if (error instanceof Error && error.name === 'NotFoundError') {
      return NextResponse.json({ error: 'Recipe not found.' }, { status: 404 });
    }
    console.error('Failed to save recipe section', error);
    return NextResponse.json(
      { error: 'Could not save your changes right now. Please try again.' },
      { status: 500 },
    );
  }
}
