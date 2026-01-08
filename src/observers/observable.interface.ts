/**
 * Entity lifecycle events.
 *
 * These events are emitted by `BaseEntity` and can be observed by collections or application code.
 */
export enum EntityEvent {
  /** Fired before the entity is created. */
  Creating = 'creating',
  /** Fired after the entity is created. */
  Created = 'created',
  /** Fired before the entity is updated. */
  Updating = 'updating',
  /** Fired after the entity is updated. */
  Updated = 'updated',
  /** Fired before the entity is deleted. */
  Deleting = 'deleting',
  /** Fired after the entity is deleted. */
  Deleted = 'deleted',
  /** Fired before the entity is saved. */
  Saving = 'saving',
  /** Fired after the entity is saved. */
  Saved = 'saved',
  /** Fired before the entity is restored. */
  Restoring = 'restoring',
  /** Fired after the entity is restored. */
  Restored = 'restored',
}

/**
 * Entity lifecycle events represented by string literals.
 *
 * This is useful when you want a string-union type without depending on the enum.
 */
export type EntityEventType =
  | 'creating'
  | 'created'
  | 'updating'
  | 'updated'
  | 'deleting'
  | 'deleted'
  | 'saving'
  | 'saved'
  | 'restoring'
  | 'restored';

/**
 * Payload for a single property change.
 */
export interface IPropertyEventPayload {
  /** The changed property name. */
  property: string;
  /** The property value before the change. */
  oldValue: unknown;
  /** The property value after the change. */
  newValue: unknown;
}

/**
 * Base observable event for an entity.
 *
 * @template TPayload - Event payload type.
 */
export interface IObservableEvent<TPayload = unknown> {
  /** The event type. */
  event: EntityEvent;
  /** Optional event payload. */
  payload?: TPayload;
}

/**
 * Event emitted when a property is changed.
 */
export interface IPropertyEvent
  extends IObservableEvent<IPropertyEventPayload> {
  /** Property-change payload. */
  payload: IPropertyEventPayload;
}
