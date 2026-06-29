import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  getDeleteRecipeUseCase,
  getGetRecipeUseCase,
  getUpdateRecipeUseCase,
} from '@infrastructure/composition';

/** Single-recipe endpoint (idea.md §2): load, edit basics, delete. */

const querySchema = z.object({
  username: z.string().trim().min(1).max(50),
});

const updateBodySchema = z.object({
  username: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1),
  color: z.string().min(1),
  icon: z.string().min(1),
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

/** Edit a recipe's basic info — name, color, icon (idea.md §2). */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = updateBodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A name, color, and icon are required.' }, { status: 400 });
  }

  const { username, ...basics } = parsed.data;
  try {
    await getUpdateRecipeUseCase().execute(username, params.id, basics);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      return NextResponse.json({ error: 'Recipe not found.' }, { status: 404 });
    }
    console.error('Failed to update recipe', error);
    return NextResponse.json(
      { error: 'Could not save your changes right now. Please try again.' },
      { status: 500 },
    );
  }
}

/** Delete a recipe and its contents (idea.md §2). */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ username: searchParams.get('username') ?? '' });
  if (!parsed.success) {
    return NextResponse.json({ error: 'A username is required.' }, { status: 400 });
  }

  try {
    await getDeleteRecipeUseCase().execute(parsed.data.username, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete recipe', error);
    return NextResponse.json(
      { error: 'Could not delete this recipe right now. Please try again.' },
      { status: 500 },
    );
  }
}
