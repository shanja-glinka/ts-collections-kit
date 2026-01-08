import {
  EntityEvent,
  type IPropertyEventPayload,
} from '../observers/observable.interface';
import type {
  IObservableEvent,
  IPropertyEvent,
} from '../observers/observable.interface';
import { TestEntity } from './helpers/test-entity';

/**
 * Type guard for `IPropertyEventPayload`.
 *
 * @param {unknown} payload - Value to validate.
 * @returns {payload is IPropertyEventPayload} True when the payload matches the expected shape.
 */
function isPropertyEventPayload(
  payload: unknown,
): payload is IPropertyEventPayload {
  // We only accept non-null objects for payloads.
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  // Validate required keys.
  if (
    !('property' in payload) ||
    !('oldValue' in payload) ||
    !('newValue' in payload)
  ) {
    return false;
  }

  // Validate the property name type.
  return typeof Reflect.get(payload, 'property') === 'string';
}

/**
 * Defines `BaseEntity` unit tests.
 *
 * @returns {void}
 */
function defineBaseEntityTests(): void {
  /**
   * Extracts the `EntityEvent` discriminator from an observable event.
   *
   * @param {IObservableEvent<unknown>} event - Observable event.
   * @returns {EntityEvent} Event discriminator.
   */
  function getEventType(event: IObservableEvent<unknown>): EntityEvent {
    return event.event;
  }

  /**
   * Validates that explicit lifecycle hook methods emit entity events.
   *
   * Given: an entity with subscribers, invoke all lifecycle hook methods.
   * Expect: lifecycle stream emits the matching event types in the same order.
   *
   * @returns {void}
   */
  function shouldEmitExplicitLifecycleHookEvents(): void {
    const entity = new TestEntity();

    const events: IObservableEvent<unknown>[] = [];

    /**
     * Collects lifecycle events for assertions.
     *
     * @param {IObservableEvent<unknown>} event - Entity lifecycle event.
     * @returns {void}
     */
    function onEntityEvent(event: IObservableEvent<unknown>): void {
      events.push(event);
    }

    const subscription = entity.subscribeEntityEvents(onEntityEvent);

    entity.creating();
    entity.created();
    entity.updating();
    entity.updated();
    entity.deleting();
    entity.deleted();
    entity.restoring();
    entity.restored();

    expect(events.map(getEventType)).toEqual([
      EntityEvent.Creating,
      EntityEvent.Created,
      EntityEvent.Updating,
      EntityEvent.Updated,
      EntityEvent.Deleting,
      EntityEvent.Deleted,
      EntityEvent.Restoring,
      EntityEvent.Restored,
    ]);

    subscription.unsubscribe();
  }

  /**
   * Validates that `captureSnapshot()` and `restoreSnapshot()` work without emitting events.
   *
   * Given: snapshot after setting `foo = 'a'`, mutate `foo = 'b'`, then restore snapshot.
   * Expect: state restored to `a` and no lifecycle/property events emitted during restore.
   *
   * @returns {void}
   */
  function shouldRestoreSnapshotWithoutEmittingEvents(): void {
    const entity = new TestEntity();

    const entityEvents: IObservableEvent<unknown>[] = [];
    const propertyEvents: IPropertyEvent[] = [];

    /**
     * Collects entity lifecycle events for assertions.
     *
     * @param {IObservableEvent<unknown>} event - Entity event.
     * @returns {void}
     */
    function onEntityEvent(event: IObservableEvent<unknown>): void {
      entityEvents.push(event);
    }

    /**
     * Collects property change events for assertions.
     *
     * @param {IPropertyEvent} event - Property event.
     * @returns {void}
     */
    function onPropertyEvent(event: IPropertyEvent): void {
      propertyEvents.push(event);
    }

    const entitySub = entity.subscribeEntityEvents(onEntityEvent);
    const propertySub = entity.subscribePropertyEvents(onPropertyEvent);

    entity.foo = 'a';

    const snapshot = entity.captureSnapshot();

    // Clear captured events to detect emissions caused by restore.
    entityEvents.length = 0;
    propertyEvents.length = 0;

    entity.foo = 'b';
    expect(entity.foo).toBe('b');

    // Clear events to detect emissions caused by restore.
    entityEvents.length = 0;
    propertyEvents.length = 0;

    // Restore must revert the state without emitting new events.
    entity.restoreSnapshot(snapshot);
    expect(entity.foo).toBe('a');
    expect(entityEvents).toHaveLength(0);
    expect(propertyEvents).toHaveLength(0);

    entitySub.unsubscribe();
    propertySub.unsubscribe();
  }

  /**
   * Validates that `BaseEntity` emits lifecycle + property events when a tracked property changes.
   *
   * Given: subscribe to streams and set `foo = 'a'`.
   * Expect: lifecycle emits Updating, Updated; property emits Updated with correct payload.
   *
   * @returns {void}
   */
  function shouldEmitEventsOnTrackedPropertyWrite(): void {
    const entity = new TestEntity();

    const entityEvents: IObservableEvent<unknown>[] = [];
    const propertyEvents: IPropertyEvent[] = [];

    /**
     * Collects entity lifecycle events for assertions.
     *
     * @param {IObservableEvent<unknown>} event - Entity event.
     * @returns {void}
     */
    function onEntityEvent(event: IObservableEvent<unknown>): void {
      entityEvents.push(event);
    }

    /**
     * Collects property change events for assertions.
     *
     * @param {IPropertyEvent} event - Property event.
     * @returns {void}
     */
    function onPropertyEvent(event: IPropertyEvent): void {
      propertyEvents.push(event);
    }

    const entitySub = entity.subscribeEntityEvents(onEntityEvent);
    const propertySub = entity.subscribePropertyEvents(onPropertyEvent);

    entity.foo = 'a';

    expect(entityEvents.map(getEventType)).toEqual([
      EntityEvent.Updating,
      EntityEvent.Updated,
    ]);
    expect(propertyEvents.map(getEventType)).toEqual([EntityEvent.Updated]);

    const updatingPayload = entityEvents[0]?.payload;
    const updatedPayload = entityEvents[1]?.payload;
    const propertyPayload = propertyEvents[0]?.payload;

    if (!isPropertyEventPayload(updatingPayload)) {
      throw new Error('Expected Updating payload to be a property payload.');
    }
    if (!isPropertyEventPayload(updatedPayload)) {
      throw new Error('Expected Updated payload to be a property payload.');
    }
    if (!isPropertyEventPayload(propertyPayload)) {
      throw new Error(
        'Expected property event payload to be a property payload.',
      );
    }

    expect(updatingPayload).toMatchObject({
      property: 'foo',
      oldValue: undefined,
      newValue: 'a',
    });
    expect(updatedPayload).toMatchObject({
      property: 'foo',
      oldValue: undefined,
      newValue: 'a',
    });
    expect(propertyPayload).toMatchObject({
      property: 'foo',
      oldValue: undefined,
      newValue: 'a',
    });

    entitySub.unsubscribe();
    propertySub.unsubscribe();
  }

  /**
   * Validates that writing the same value does not emit events.
   *
   * Given: write `foo = 'a'` twice.
   * Expect: event counts remain unchanged after the second write.
   *
   * @returns {void}
   */
  function shouldNotEmitEventsWhenValueDoesNotChange(): void {
    const entity = new TestEntity();

    const entityEvents: IObservableEvent<unknown>[] = [];
    const propertyEvents: IPropertyEvent[] = [];

    /**
     * Collects entity lifecycle events for assertions.
     *
     * @param {IObservableEvent<unknown>} event - Entity event.
     * @returns {void}
     */
    function onEntityEvent(event: IObservableEvent<unknown>): void {
      entityEvents.push(event);
    }

    /**
     * Collects property change events for assertions.
     *
     * @param {IPropertyEvent} event - Property event.
     * @returns {void}
     */
    function onPropertyEvent(event: IPropertyEvent): void {
      propertyEvents.push(event);
    }

    const entitySub = entity.subscribeEntityEvents(onEntityEvent);
    const propertySub = entity.subscribePropertyEvents(onPropertyEvent);

    entity.foo = 'a';
    const entityEventsAfterFirstWrite = entityEvents.length;
    const propertyEventsAfterFirstWrite = propertyEvents.length;

    // Writing the exact same value should not produce additional events.
    entity.foo = 'a';

    expect(entityEvents.length).toBe(entityEventsAfterFirstWrite);
    expect(propertyEvents.length).toBe(propertyEventsAfterFirstWrite);

    entitySub.unsubscribe();
    propertySub.unsubscribe();
  }

  /**
   * Validates that properties starting with `_` are ignored by change tracking.
   *
   * Given: write `_internal = 'x'`.
   * Expect: zero lifecycle or property events captured.
   *
   * @returns {void}
   */
  function shouldIgnoreUnderscoredProperties(): void {
    const entity = new TestEntity();

    const entityEvents: IObservableEvent<unknown>[] = [];
    const propertyEvents: IPropertyEvent[] = [];

    /**
     * Collects entity lifecycle events for assertions.
     *
     * @param {IObservableEvent<unknown>} event - Entity event.
     * @returns {void}
     */
    function onEntityEvent(event: IObservableEvent<unknown>): void {
      entityEvents.push(event);
    }

    /**
     * Collects property change events for assertions.
     *
     * @param {IPropertyEvent} event - Property event.
     * @returns {void}
     */
    function onPropertyEvent(event: IPropertyEvent): void {
      propertyEvents.push(event);
    }

    const entitySub = entity.subscribeEntityEvents(onEntityEvent);
    const propertySub = entity.subscribePropertyEvents(onPropertyEvent);

    entity._internal = 'x';

    expect(entityEvents).toHaveLength(0);
    expect(propertyEvents).toHaveLength(0);

    entitySub.unsubscribe();
    propertySub.unsubscribe();
  }

  it(
    'emits lifecycle and property events on tracked writes',
    shouldEmitEventsOnTrackedPropertyWrite,
  );
  it(
    'does not emit events when value does not change',
    shouldNotEmitEventsWhenValueDoesNotChange,
  );
  it('ignores underscored properties', shouldIgnoreUnderscoredProperties);
  it(
    'emits explicit lifecycle hook events',
    shouldEmitExplicitLifecycleHookEvents,
  );
  it(
    'restores snapshots without emitting events',
    shouldRestoreSnapshotWithoutEmittingEvents,
  );
}

describe('BaseEntity', defineBaseEntityTests);
