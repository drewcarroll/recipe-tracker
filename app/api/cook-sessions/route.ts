import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recipeSnapshotSchema } from '@application/types';
import { getLogCookSessionUseCase } from '@infrastructure/composition';

/**
 * Cook-session log endpoint (idea.md §3, §4). The guided cook flow POSTs here
 * when a cook finishes: it freezes the recipe's contents into an immutable
 * snapshot and records how long the cook took. Deviations and post-cook notes
 * arrive with the later §3 work, so they are not part of this contract yet.
 */

const createBodySchema = z.object({
  username: z.string().trim().min(1).max(50),
  recipeId: z.string().uuid().nullable(),
  recipeName: z.string().trim().min(1),
  snapshot: recipeSnapshotSchema,
  durationSeconds: z.number().int().nonnegative().default(0),
});

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = createBodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A recipe name and snapshot are required.' },
      { status: 400 },
    );
  }

  const { username, ...session } = parsed.data;
  try {
    const created = await getLogCookSessionUseCase().execute(username, session);
    return NextResponse.json({ session: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to log cook session', error);
    return NextResponse.json(
      { error: 'Could not save your cook session right now. Please try again.' },
      { status: 500 },
    );
  }
}
