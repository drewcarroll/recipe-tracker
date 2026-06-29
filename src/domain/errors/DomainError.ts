/**
 * Base class for all domain-level errors.
 * Domain errors represent violations of business rules / invariants.
 * They must never leak framework or infrastructure concerns.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    // Restore prototype chain for instanceof checks when targeting ES5/ES6.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {}

export class RecipeNotFoundError extends DomainError {
  constructor(recipeId: string) {
    super(`Recipe with id "${recipeId}" was not found.`);
  }
}
