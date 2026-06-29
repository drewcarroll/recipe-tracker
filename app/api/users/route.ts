import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getEnsureUserUseCase } from '@infrastructure/composition';

/** Username "log in / sign up" endpoint (idea.md §0). */

const bodySchema = z.object({
  // `.trim()` normalises before the length check so "  " is rejected.
  username: z.string().trim().min(1).max(50),
});

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A username between 1 and 50 characters is required.' },
      { status: 400 },
    );
  }

  try {
    const user = await getEnsureUserUseCase().execute(parsed.data.username);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Failed to ensure user', error);
    return NextResponse.json(
      { error: 'Could not sign in right now. Please try again.' },
      { status: 500 },
    );
  }
}
