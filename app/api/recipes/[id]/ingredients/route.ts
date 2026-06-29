import type { NextResponse } from 'next/server';

import { getSaveRecipeSectionsUseCase } from '@infrastructure/composition';

import { handleSectionSave } from '../sectionHandler';

/** Replace a recipe's whole ingredient list (idea.md §2). */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  return handleSectionSave(request, params.id, (username, recipeId, items) =>
    getSaveRecipeSectionsUseCase().saveIngredients(username, recipeId, items),
  );
}
