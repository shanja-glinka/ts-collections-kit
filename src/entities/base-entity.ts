import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import 'reflect-metadata';
import { Observable, Subject, Subscription } from 'rxjs';
import { IBaseTransformEntityContract } from '../contracts/base-transform-entity.contract';
import { IObservable } from '../contracts/observable.contract';
import { IBaseEntity } from '../interfaces/base.entity.interface';
import {
  EntityEvent,
  IObservableEvent,
  IPropertyEvent,
  IPropertyEventPayload,
} from '../observers/observable.interface';
import { deepClone } from '../utils/clone';

/**
 * Base entity with:
 * - plain-object transformation and validation (`class-transformer`, `class-validator`)
 * - lifecycle events (Observer via RxJS)
 * - property change tracking (via `Proxy`)
 *
 * Property writes are intercepted by a `Proxy`, so you do not need to implement manual accessors
 * for every field to emit change events.
 */
export class BaseEntity
  implements IBaseEntity, IBaseTransformEntityContract, IObservable
{
  /** Entity identifier. */
  public id!: string;
  /** Creation timestamp. */
  public createdAt!: Date;
  /** Update timestamp. */
  public updatedAt!: Date;
  /** Creator identifier. */
  public createdBy!: string;
  /** Updater identifier. */
  public updatedBy!: string;

  /**
   * RxJS subject for entity lifecycle events.
   *
   * Emits: creating/created, updating/updated, deleting/deleted, restoring/restored, etc.
   */
  protected eventSubject = new Subject<IObservableEvent<unknown>>();

  /**
   * RxJS subject for property change events.
   */
  private propertyChangeSubject = new Subject<IPropertyEvent>();

  /** Internal flag used to apply state restores without emitting events. */
  private trackingSuspended = false;

  /**
   * Returns an observable stream of entity lifecycle events.
   *
   * @returns {Observable<IObservableEvent<unknown>>} Observable of entity lifecycle events.
   */
  public getEntityObservable(): Observable<IObservableEvent<unknown>> {
    return this.eventSubject.asObservable();
  }

  /**
   * Returns an observable stream of property change events.
   *
   * @returns {Observable<IPropertyEvent>} Observable of property change events.
   */
  public getPropertyObservable(): Observable<IPropertyEvent> {
    return this.propertyChangeSubject.asObservable();
  }

  /**
   * Subscribes to entity lifecycle events.
   *
   * @param {(data: IObservableEvent<unknown>) => void} handler - Event handler.
   *
   * @returns {Subscription} Subscription instance.
   */
  public subscribeEntityEvents(
    handler: (data: IObservableEvent<unknown>) => void,
  ): Subscription {
    return this.eventSubject.subscribe(handler);
  }

  /**
   * Subscribes to property change events.
   *
   * @param {(data: IPropertyEvent) => void} handler - Event handler.
   *
   * @returns {Subscription} Subscription instance.
   */
  public subscribePropertyEvents(
    handler: (data: IPropertyEvent) => void,
  ): Subscription {
    return this.propertyChangeSubject.subscribe(handler);
  }

  /**
   * Wraps the instance in a `Proxy` to intercept property writes.
   *
   * When a property changes (and the new value differs from the old one):
   * 1) emit `EntityEvent.Updating` on the entity stream
   * 2) perform the write on the underlying target
   * 3) emit `EntityEvent.Updated` on the property stream
   * 4) emit `EntityEvent.Updated` on the entity stream
   *
   * @param {...readonly unknown[]} _args - Unused arguments (kept for compatibility with subclasses).
   */
  constructor(..._args: readonly unknown[]) {
    /**
     * Proxy `set` trap used to track property writes.
     *
     * @param {BaseEntity} target - Proxy target.
     * @param {string | symbol} property - Property key.
     * @param {unknown} value - New value.
     * @param {unknown} receiver - Write receiver.
     * @returns {boolean} True when the write succeeds.
     */
    function setTrap(
      target: BaseEntity,
      property: string | symbol,
      value: unknown,
      receiver: unknown,
    ): boolean {
      // Do not track writes to internal state used by `BaseEntity` itself.
      if (
        typeof property === 'string' &&
        target.isInternalSnapshotKey(property)
      ) {
        return Reflect.set(target, property, value, receiver);
      }

      // During restores, perform writes without emitting events.
      if (target.trackingSuspended) {
        return Reflect.set(target, property, value, receiver);
      }

      // Only track "regular" string properties (skip private/technical keys).
      if (typeof property === 'string' && property[0] !== '_') {
        // Read the previous value from the underlying target object.
        const oldValue: unknown = Reflect.get(target, property);

        // If the value is unchanged, do nothing.
        if (!Object.is(oldValue, value)) {
          const properties: IPropertyEventPayload = {
            property,
            oldValue,
            newValue: value,
          };
          // Emit "before update" on the entity stream.
          target.emitEntityEvent(EntityEvent.Updating, properties);

          // Perform the write on the target object (avoid re-entering the proxy setter).
          Reflect.set(target, property, value);

          // Emit "property updated" event on the property stream.
          target.emitPropertyEvent(EntityEvent.Updated, properties);

          // Emit "after update" on the entity stream.
          target.emitEntityEvent(EntityEvent.Updated, properties);
        }
        return true;
      }
      // For private keys or symbols: do a regular write.
      return Reflect.set(target, property, value, receiver);
    }

    return new Proxy(this, { set: setTrap });
  }

  /**
   * Checks whether a key should be excluded from state snapshots.
   *
   * @param {string} key - Property key.
   * @returns {boolean} True when the key is internal to `BaseEntity`.
   */
  private isInternalSnapshotKey(key: string): boolean {
    return (
      key === 'eventSubject' ||
      key === 'propertyChangeSubject' ||
      key === 'trackingSuspended'
    );
  }

  /**
   * Captures a snapshot of the current entity state (Memento).
   *
   * Only enumerable own properties are included. Internal observables and underscored properties are excluded.
   *
   * @returns {Readonly<Record<string, unknown>>} Snapshot object.
   */
  public captureSnapshot(): Readonly<Record<string, unknown>> {
    const snapshot: Record<string, unknown> = {};

    for (const key of Object.keys(this)) {
      // Skip internal and underscored keys.
      if (key[0] === '_' || this.isInternalSnapshotKey(key)) {
        continue;
      }

      const value: unknown = Reflect.get(this, key);

      // Skip methods and function-valued fields.
      if (typeof value === 'function') {
        continue;
      }

      // Clone values to make the snapshot immune to later in-place mutations.
      Reflect.set(snapshot, key, deepClone(value));
    }

    return snapshot;
  }

  /**
   * Restores entity state from a snapshot (Memento).
   *
   * The restore is applied without emitting lifecycle or property events.
   *
   * @param {Readonly<Record<string, unknown>>} snapshot - Snapshot object produced by `captureSnapshot()`.
   * @returns {void}
   */
  public restoreSnapshot(snapshot: Readonly<Record<string, unknown>>): void {
    const snapshotKeys = Object.keys(snapshot);
    const snapshotKeySet = new Set<string>(snapshotKeys);

    this.trackingSuspended = true;

    try {
      // Remove keys that no longer exist in the snapshot.
      for (const key of Object.keys(this)) {
        if (key[0] === '_' || this.isInternalSnapshotKey(key)) {
          continue;
        }

        if (!snapshotKeySet.has(key)) {
          Reflect.deleteProperty(this, key);
        }
      }

      // Restore snapshot values.
      for (const key of snapshotKeys) {
        if (key[0] === '_' || this.isInternalSnapshotKey(key)) {
          continue;
        }

        const value: unknown = Reflect.get(snapshot, key);
        Reflect.set(this, key, deepClone(value));
      }
    } finally {
      this.trackingSuspended = false;
    }
  }

  /**
   * Transforms a plain object into an entity instance and validates it.
   *
   * @template T
   * @param {new () => T} this - Concrete entity constructor.
   * @param {object} plain - Plain object to transform.
   *
   * @returns {Promise<T>} Validated entity instance.
   *
   * @throws {Error} When validation fails.
   */
  static async plainToInstance<T extends BaseEntity>(
    this: new () => T,
    plain: object,
  ): Promise<T> {
    const instance = plainToInstance(this, plain, {
      excludeExtraneousValues: true,
    });

    const errors = await validate(instance);

    if (errors.length > 0) {
      const errorMessage = BaseEntity.formatValidationErrors(errors);
      throw new Error(errorMessage);
    }

    return instance;
  }

  /**
   * Formats validation errors into a readable string.
   *
   * @param {ValidationError[]} errors - Validation errors.
   *
   * @returns {string} Human-readable error message.
   */
  private static formatValidationErrors(errors: ValidationError[]): string {
    const messages: string[] = [];

    for (const error of errors) {
      const constraints = error.constraints
        ? Object.values(error.constraints).join(', ')
        : 'Unknown validation error';
      messages.push(`Property: ${error.property} - ${constraints}`);
    }

    return messages.join('\n');
  }

  /**
   * Emits an entity lifecycle event.
   *
   * @param {EntityEvent} event - Event type.
   *
   * @param {unknown} [payload] - Optional event payload.
   * @returns {void}
   */
  protected emitEntityEvent(event: EntityEvent, payload?: unknown): void {
    this.eventSubject.next({ event, payload });
  }

  /**
   * Emits a property lifecycle event.
   *
   * @param {EntityEvent} event - Event type.
   *
   * @param {IPropertyEventPayload} payload - Property-change payload.
   * @returns {void}
   */
  protected emitPropertyEvent(
    event: EntityEvent,
    payload: IPropertyEventPayload,
  ): void {
    this.propertyChangeSubject.next({ event, payload });
  }

  /**
   * Explicit lifecycle hook: `creating`.
   *
   * @returns {void}
   */

  public creating(): void {
    this.emitEntityEvent(EntityEvent.Creating);
  }

  /**
   * Explicit lifecycle hook: `created`.
   *
   * @returns {void}
   */
  public created(): void {
    this.emitEntityEvent(EntityEvent.Created);
  }

  /**
   * Explicit lifecycle hook: `updating`.
   *
   * @returns {void}
   */
  public updating(): void {
    this.emitEntityEvent(EntityEvent.Updating);
  }

  /**
   * Explicit lifecycle hook: `updated`.
   *
   * @returns {void}
   */
  public updated(): void {
    this.emitEntityEvent(EntityEvent.Updated);
  }

  /**
   * Explicit lifecycle hook: `deleting`.
   *
   * @returns {void}
   */
  public deleting(): void {
    this.emitEntityEvent(EntityEvent.Deleting);
  }

  /**
   * Explicit lifecycle hook: `deleted`.
   *
   * @returns {void}
   */
  public deleted(): void {
    this.emitEntityEvent(EntityEvent.Deleted);
  }

  /**
   * Explicit lifecycle hook: `restoring`.
   *
   * @returns {void}
   */
  public restoring(): void {
    this.emitEntityEvent(EntityEvent.Restoring);
  }

  /**
   * Explicit lifecycle hook: `restored`.
   *
   * @returns {void}
   */
  public restored(): void {
    this.emitEntityEvent(EntityEvent.Restored);
  }
}
