import { Collection } from 'collect.js';

/**
 * Adapter that centralizes interaction with `collect.js` internals.
 *
 * This keeps private field access in one place, so breaking changes can be addressed here.
 */
export class CollectAdapter<T> {
  /**
   * Replaces underlying items of a collection.
   *
   * @param {Collection<T>} collection - Target collection.
   * @param {readonly T[]} items - Items to set.
   * @returns {void}
   */
  public replaceItems(collection: Collection<T>, items: readonly T[]): void {
    // collect.js stores items in an `items` property on the instance.
    Reflect.set(collection as unknown as { items: T[] }, 'items', Array.from(items));
  }
}
