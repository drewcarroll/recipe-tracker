import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getGetRecipeUseCase } from '@infrastructure/composition';

/** Single-recipe detail endpoint (idea.md §2), scoped to the active username. */

const querySchema = z.object({
  username: z.string().trim().min(1).max(50),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ username: searchParams.get('username') ?? '' });
  if (!parsed.success) {
    return NextResponse.json({ error: 'A username is required.' }, { status: 400 });
  }

  try {
    const recipe = await getGetRecipeUseCase().execute(parsed.data.username, params.id);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found.' }, { status: 404 });
    }
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Failed to load recipe', error);
    return NextResponse.json(
      { error: 'Could not load this recipe right now. Please try again.' },
      { status: 500 },
    );
  }
}
