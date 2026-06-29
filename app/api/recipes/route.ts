import { NextRequest, NextResponse } from 'next/server';
import { buildRecipeController } from '@infrastructure/composition/controllers';
import { toHttpError } from '@interfaces/http/errorHandler';

/**
 * Next.js route handler = framework entry point (composition boundary).
 * It pulls a fully-wired controller from the composition root and delegates.
 * No business logic lives here.
 */
export async function GET() {
  try {
    const result = await buildRecipeController().list();
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const handled = toHttpError(error);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const result = await buildRecipeController().create(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const handled = toHttpError(error);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
