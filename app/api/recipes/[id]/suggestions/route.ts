import { NextResponse } from 'next/server';
import { z } from 'zod';

import { cookNotesSchema } from '@application/types';
import { getSuggestRecipeChangesUseCase } from '@infrastructure/composition';

/**
 * Post-cook "notes for next time" endpoint (idea.md §3): the guided cook flow
 * POSTs the cook's free-text notes here when a cook finishes, and Claude turns
 * them into a list of suggested recipe changes for the user to Approve/Reject.
 * Nothing is persisted — applying an approved suggestion is a separate call
 * (see ./suggestions/apply). The Anthropic key stays on the server (idea.md §6);
 * give the model room to run.
 */
export const maxDuration = 60;

const bodySchema = z.object({
  username: z.string().trim().min(1).max(50),
  notes: cookNotesSchema,
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Write some notes to get suggestions.' }, { status: 400 });
  }

  try {
    const suggestions = await getSuggestRecipeChangesUseCase().execute(
      parsed.data.username,
      params.id,
      parsed.data.notes,
    );
    if (suggestions === null) {
      return NextResponse.json({ error: 'Recipe not found.' }, { status: 404 });
    }
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Failed to suggest recipe changes', error);
    return NextResponse.json(
      { error: 'We couldn’t turn those notes into suggestions. Please try again.' },
      { status: 502 },
    );
  }
}
