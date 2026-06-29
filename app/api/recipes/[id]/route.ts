import { NextResponse } from 'next/server';
import { buildRecipeController } from '@infrastructure/composition/controllers';
import { toHttpError } from '@interfaces/http/errorHandler';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await buildRecipeController().getById(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const handled = toHttpError(error);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
