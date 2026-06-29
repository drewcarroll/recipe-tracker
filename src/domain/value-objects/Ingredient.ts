import { ValidationError } from '../errors/DomainError';

/**
 * Value Object representing a single ingredient line in a recipe.
 * Immutable and compared by value. Enforces its own invariants.
 */
export class Ingredient {
  private constructor(
    public readonly name: string,
    public readonly quantity: number,
    public readonly unit: string,
  ) {}

  static create(props: { name: string; quantity: number; unit: string }): Ingredient {
    const name = props.name?.trim();
    if (!name) {
      throw new ValidationError('Ingredient name cannot be empty.');
    }
    if (!Number.isFinite(props.quantity) || props.quantity <= 0) {
      throw new ValidationError('Ingredient quantity must be a positive number.');
    }
    const unit = props.unit?.trim();
    if (!unit) {
      throw new ValidationError('Ingredient unit cannot be empty.');
    }
    return new Ingredient(name, props.quantity, unit);
  }

  equals(other: Ingredient): boolean {
    return this.name === other.name && this.quantity === other.quantity && this.unit === other.unit;
  }
}
