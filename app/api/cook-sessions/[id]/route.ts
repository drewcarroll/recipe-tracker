import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getDeleteCookSessionUseCase } from '@infrastructure/composition';

/** Single cook-session endpoint (idea.md §4): delete one logged cook. */

const querySchema = z.object({
  username: z.string().trim().min(1).max(50),
});

/** Delete one of a user's cook sessions (idea.md §4). */
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
    await getDeleteCookSessionUseCase().execute(parsed.data.username, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete cook session', error);
    return NextResponse.json(
      { error: 'Could not delete this session right now. Please try again.' },
      { status: 500 },
    );
  }
}
