import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getListRecipesUseCase } from '@infrastructure/composition';

/** "Your Recipes" list endpoint (idea.md §2), scoped to the active username. */

const querySchema = z.object({
  username: z.string().trim().min(1).max(50),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ username: searchParams.get('username') ?? '' });
  if (!parsed.success) {
    return NextResponse.json({ error: 'A username is required.' }, { status: 400 });
  }

  try {
    const recipes = await getListRecipesUseCase().execute(parsed.data.username);
    return NextResponse.json({ recipes });
  } catch (error) {
    console.error('Failed to list recipes', error);
    return NextResponse.json(
      { error: 'Could not load your recipes right now. Please try again.' },
      { status: 500 },
    );
  }
}
