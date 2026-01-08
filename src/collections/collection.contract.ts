import type { Collection, CollectionKey } from 'collect.js';
import type { Subscription } from 'rxjs';
import type { IVisitor } from '../contracts/visitor.contract';
import type { CollectionEvent } from '../observers/collection-events';

/**
 * Collection contract.
 *
 * This contract keeps the Laravel-like API surface from `collect.js` while adding:
 * - snapshots (Memento)
 * - transactions
 * - event stream (Observer)
 * - visitors (Visitor pattern)
 *
 * @template T - Collection item type.
 */
export interface ICollection<T>
  extends Omit<Collection<T>, 'map' | 'filter' | 'reduce'> {
  /**
   * Maps items into a new `ICollection`.
   *
   * @template U
   * @param {(item: T, key: CollectionKey) => U} callback - Mapping function.
   * @returns {ICollection<U>} New collection with mapped items.
   */
  map<U>(callback: (item: T, key: CollectionKey) => U): ICollection<U>;

  /**
   * Filters items into a new `ICollection`.
   *
   * When no predicate is provided, the runtime removes "falsy" values (matches `collect.js` behavior).
   *
   * @returns {ICollection<T>} New collection with filtered items.
   */
  filter(): ICollection<T>;

  /**
   * Filters items into a new `ICollection`.
   *
   * @param {(item: T, key: CollectionKey) => boolean} predicate - Filter predicate.
   * @returns {ICollection<T>} New collection with filtered items.
   */
  filter(predicate: (item: T, key: CollectionKey) => boolean): ICollection<T>;

  /**
   * Reduces items to a single value.
   *
   * @template U
   * Note: when no initial value is provided, the runtime starts with `null`.
   *
   * @param {(carry: U | null, item: T, key: CollectionKey) => U} callback - Reducer function.
   * @returns {U | null} Reduced value.
   */
  reduce<U>(
    callback: (carry: U | null, item: T, key: CollectionKey) => U,
  ): U | null;

  /**
   * Reduces items to a single value.
   *
   * @template U
   * @param {(carry: U | null, item: T, key: CollectionKey) => U} callback - Reducer function.
   * @param {U} initial - Initial accumulator value.
   * @returns {U} Reduced value.
   */
  reduce<U>(
    callback: (carry: U | null, item: T, key: CollectionKey) => U,
    initial: U,
  ): U;

  /**
   * Adds an item to the collection.
   *
   * @param {T} item - Item to add.
   * @returns {void}
   */
  add(item: T): void;

  /**
   * Removes an item from the collection.
   *
   * @param {T} item - Item to remove.
   * @returns {void}
   */
  remove(item: T): void;

  /**
   * Commits collection changes outside a transaction.
   *
   * @returns {void}
   */
  commit(): void;

  /**
   * Rolls back the last snapshot outside a transaction.
   *
   * @returns {void}
   */
  rollback(): void;

  /**
   * Applies a visitor to every item.
   *
   * @param {IVisitor<T>} visitor - Visitor instance.
   * @returns {void}
   */
  accept(visitor: IVisitor<T>): void;

  /**
   * Subscribes to collection events.
   *
   * @param {(event: CollectionEvent<T>) => void} callback - Event callback.
   * @returns {Subscription} Subscription instance.
   */
  subscribe(callback: (event: CollectionEvent<T>) => void): Subscription;

  /**
   * Returns all items.
   *
   * @returns {T[]} Items.
   */
  getItems(): T[];

  /**
   * Starts a transaction.
   *
   * @returns {number} Transaction token.
   */
  beginTransaction(): number;

  /**
   * Commits the active transaction.
   *
   * @returns {number} Transaction token.
   */
  commitTransaction(): number;

  /**
   * Rolls back the active transaction.
   *
   * @returns {void}
   */
  rollbackTransaction(): void;
}
