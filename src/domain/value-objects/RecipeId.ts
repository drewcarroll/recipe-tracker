import { ValidationError } from '../errors/DomainError';

/**
 * Value Object representing the identity of a Recipe.
 * Immutable and compared by value.
 */
export class RecipeId {
  private constructor(private readonly value: string) {}

  static create(value: string): RecipeId {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new ValidationError('RecipeId cannot be empty.');
    }
    return new RecipeId(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: RecipeId): boolean {
    return this.value === other.value;
  }
}
