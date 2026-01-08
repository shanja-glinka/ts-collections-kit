import { EntityEvent, IPropertyEventPayload } from './observable.interface';

/**
 * Collection event types.
 *
 * This is the set of events emitted by `BaseCollection`.
 */
export type CollectionEventType =
  | 'add'
  | 'remove'
  | 'commit'
  | 'rollback'
  | EntityEvent;

/**
 * Payload for a collection commit event.
 *
 * @template T - Collection item type.
 */
export interface ICollectionCommitPayload<T> {
  /**
   * Current collection state at commit time.
   *
   * Note: the array is read-only to discourage accidental mutation of snapshots.
   */
  state: readonly T[];
  /** Optional transaction token if the commit happened inside a transaction. */
  token?: number;
}

/**
 * Payload for an entity-related collection event.
 *
 * @template T - Collection item type.
 */
export interface ICollectionEntityChangePayload<T> {
  /** The entity that emitted the event. */
  item: T;
  /** Property change details emitted by the entity. */
  change: IPropertyEventPayload;
}

/**
 * Discriminated union for collection events.
 *
 * @template T - Collection item type.
 */
export type CollectionEvent<T> =
  | { type: 'add'; payload: T }
  | { type: 'remove'; payload: T }
  | { type: 'commit'; payload: ICollectionCommitPayload<T> }
  | { type: 'rollback'; payload: readonly T[] }
  | { type: EntityEvent; payload: ICollectionEntityChangePayload<T> };

/**
 * Backwards-compatible alias for the collection event union.
 *
 * @template T - Collection item type.
 */
export type ICollectionEvent<T> = CollectionEvent<T>;
