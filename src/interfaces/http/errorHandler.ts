import { HttpResult } from './RecipeController';

/**
 * Maps thrown errors to HTTP responses. Status code decisions happen at the
 * interface boundary, based on the error's name, without importing domain.
 */
export function toHttpError(error: unknown): HttpResult {
  const name = error instanceof Error ? error.name : 'UnknownError';
  const message = error instanceof Error ? error.message : 'Unexpected error';

  switch (name) {
    case 'ValidationError':
      return { status: 400, body: { error: name, message } };
    case 'RecipeNotFoundError':
      return { status: 404, body: { error: name, message } };
    default:
      return { status: 500, body: { error: 'InternalServerError', message: 'Something went wrong' } };
  }
}
