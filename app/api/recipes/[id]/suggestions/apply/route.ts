import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recipeSuggestionSchema } from '@application/types';
import { getApplyRecipeSuggestionUseCase } from '@infrastructure/composition';

/**
 * Apply one approved "notes for next time" suggestion to the recipe (idea.md §3).
 * The change logic lives in the use case; this handler only validates the
 * envelope and returns the updated recipe so the client can keep applying
 * further approved suggestions against fresh contents.
 */
const bodySchema = z.object({
  username: z.string().trim().min(1).max(50),
  suggestion: recipeSuggestionSchema,
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid suggestion is required.' }, { status: 400 });
  }

  try {
    const recipe = await getApplyRecipeSuggestionUseCase().execute(
      parsed.data.username,
      params.id,
      parsed.data.suggestion,
    );
    if (recipe === null) {
      return NextResponse.json({ error: 'Recipe not found.' }, { status: 404 });
    }
    return NextResponse.json({ recipe });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      return NextResponse.json({ error: 'Recipe not found.' }, { status: 404 });
    }
    console.error('Failed to apply recipe suggestion', error);
    return NextResponse.json(
      { error: 'Could not apply that change right now. Please try again.' },
      { status: 500 },
    );
  }
}
