import { BaseCollection } from '../../collections/base-collection';
import type { ICollectionOptions } from '../../interfaces/collection-options.interface';

/**
 * Test-only `BaseCollection` subclass that exposes protected internals for assertions.
 *
 * @template T - Item type.
 */
export class TestCollection<T> extends BaseCollection<T> {
  /**
   * Creates a test collection.
   *
   * @param {readonly T[] | undefined} initialItems - Initial items.
   * @param {ICollectionOptions | undefined} options - Collection options.
   */
  constructor(initialItems?: readonly T[], options?: ICollectionOptions) {
    super(initialItems, options);
  }

  /**
   * Returns the number of stored snapshots.
   *
   * @returns {number} Snapshot count.
   */
  public getSnapshotCount(): number {
    return this.history.length;
  }

  /**
   * Returns whether a transaction is currently active.
   *
   * @returns {boolean} True when a transaction is active.
   */
  public isTransactionActive(): boolean {
    return this.transactionActive;
  }
}
