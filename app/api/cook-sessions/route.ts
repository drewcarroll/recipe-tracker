import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recipeSnapshotSchema } from '@application/types';
import {
  getListCookSessionsUseCase,
  getLogCookSessionUseCase,
} from '@infrastructure/composition';

/**
 * Cook-session log endpoint (idea.md §3, §4). The guided cook flow POSTs here
 * when a cook finishes: it freezes the recipe's contents into an immutable
 * snapshot, records how long the cook took, and captures the free-form notes
 * jotted in the per-cook notepad plus the free-text "notes for next time". The History tab
 * GETs here to list a user's past cooks. The snapshot is stored by value, so it
 * is independent of the live recipe rows and later edits never alter it.
 */

const querySchema = z.object({
  username: z.string().trim().min(1).max(50),
});

const createBodySchema = z.object({
  username: z.string().trim().min(1).max(50),
  recipeId: z.string().uuid().nullable(),
  recipeName: z.string().trim().min(1),
  snapshot: recipeSnapshotSchema,
  cookNotes: z.string().trim().max(2000).default(''),
  notes: z.string().trim().max(2000).default(''),
  durationSeconds: z.number().int().nonnegative().default(0),
});

/** List a user's cook sessions, most recent first — the History log (idea.md §4). */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ username: searchParams.get('username') ?? '' });
  if (!parsed.success) {
    return NextResponse.json({ error: 'A username is required.' }, { status: 400 });
  }

  try {
    const sessions = await getListCookSessionsUseCase().execute(parsed.data.username);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Failed to list cook sessions', error);
    return NextResponse.json(
      { error: 'Could not load your cook history right now. Please try again.' },
      { status: 500 },
    );
  }
}

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
