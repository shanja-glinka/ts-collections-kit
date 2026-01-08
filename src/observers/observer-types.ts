import { EntityEvent } from './observable.interface';

/**
 * Entity event handler definition.
 *
 * @template TEntity - Entity type.
 * @template TPayload - Payload type.
 */
export interface IEventHandler<TEntity = unknown, TPayload = unknown> {
  /** Event name, e.g. `EntityEvent.Created`. */
  eventName: EntityEvent;
  /**
   * Callback invoked when the event fires.
   *
   * @param {TEntity} entity - The entity instance.
   * @param {TPayload | undefined} payload - Optional event payload.
   * @returns {void}
   */
  callback: (entity: TEntity, payload?: TPayload) => void;
}
