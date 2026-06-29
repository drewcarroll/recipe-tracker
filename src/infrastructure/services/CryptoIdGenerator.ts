import { randomUUID } from 'node:crypto';
import { IdGenerator } from '@application/ports/IdGenerator';

/**
 * Concrete IdGenerator implementation using the Node crypto module.
 * Fulfils the application-layer IdGenerator port.
 */
export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
