import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCreateRecipeUseCase, getListRecipesUseCase } from '@infrastructure/composition';

/** "Your Recipes" list + create endpoint (idea.md §2), scoped to the username. */

const querySchema = z.object({
  username: z.string().trim().min(1).max(50),
});

const createBodySchema = z.object({
  username: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1),
  color: z.string().min(1),
  icon: z.string().min(1),
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

/** Create a blank recipe (idea.md §2: "Create from Scratch"). */
export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = createBodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A name, color, and icon are required.' }, { status: 400 });
  }

  const { username, ...basics } = parsed.data;
  try {
    const recipe = await getCreateRecipeUseCase().execute(username, basics);
    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    console.error('Failed to create recipe', error);
    return NextResponse.json(
      { error: 'Could not create your recipe right now. Please try again.' },
      { status: 500 },
    );
  }
}
