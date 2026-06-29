import { NextResponse } from 'next/server';
import { z } from 'zod';

import { pastedRecipeTextSchema } from '@application/types';

import { getParseRecipeUseCase } from '@infrastructure/composition';

/**
 * Paste → structured recipe endpoint (idea.md §2, §6). Accepts raw recipe text,
 * has Claude turn it into a structured recipe (ingredients with quantity + unit
 * + name, prep, steps), and returns it as JSON — without persisting anything.
 *
 * The Anthropic key lives only on the server (the parser runs in the
 * infrastructure layer); the response is validated against the shared Zod
 * schema before it leaves the parser. Give the model room on long pastes.
 */
export const maxDuration = 60;

const bodySchema = z.object({ text: pastedRecipeTextSchema });

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Provide some recipe text to convert.' }, { status: 400 });
  }

  try {
    const recipe = await getParseRecipeUseCase().execute(parsed.data.text);
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Failed to parse recipe text', error);
    return NextResponse.json(
      { error: 'We couldn’t turn that into a recipe. Please try again.' },
      { status: 502 },
    );
  }
}
