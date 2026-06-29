/**
 * Port for generating unique identifiers.
 * The application defines the contract; infrastructure provides the
 * concrete implementation (e.g. crypto.randomUUID, nanoid, etc.).
 */
export interface IdGenerator {
  generate(): string;
}
