import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCreateRecipeFromTextUseCase } from '@infrastructure/composition';

import { DEFAULT_ICON_KEY } from '../../../_design/icons';
import { DEFAULT_PASTEL_KEY } from '../../../_design/palette';

/**
 * "Create using AI" endpoint (idea.md §2): pasted recipe text → Claude →
 * structured recipe, saved directly as a new recipe. The Anthropic key lives
 * only on the server (idea.md §6). Give the model room to run on long pastes.
 */
export const maxDuration = 60;

const MAX_RECIPE_CHARS = 20000;

const bodySchema = z.object({
  username: z.string().trim().min(1).max(50),
  text: z.string().trim().min(1).max(MAX_RECIPE_CHARS),
});

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Give the length case its own clear message instead of the generic
  // "paste some text" — a too-long paste is a common, fixable mistake.
  if (
    typeof (payload as { text?: unknown } | null)?.text === 'string' &&
    (payload as { text: string }).text.trim().length > MAX_RECIPE_CHARS
  ) {
    return NextResponse.json(
      { error: 'Recipe too long! Keep it under 20k characters.' },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Paste some recipe text to convert.' }, { status: 400 });
  }

  try {
    const recipe = await getCreateRecipeFromTextUseCase().execute(
      parsed.data.username,
      parsed.data.text,
      {
        color: DEFAULT_PASTEL_KEY,
        icon: DEFAULT_ICON_KEY,
      },
    );
    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    console.error('Failed to create recipe from text', error);
    return NextResponse.json(
      { error: 'We couldn’t turn that into a recipe. Please try again.' },
      { status: 502 },
    );
  }
}
