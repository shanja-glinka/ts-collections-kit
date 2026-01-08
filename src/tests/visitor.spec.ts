import { EntityEvent } from '../observers/observable.interface';
import type { CollectionEvent } from '../observers/collection-events';
import { NotificationsCollection } from './collections/notification.collection';
import { Notification } from './entities/notification.entity';
import { NotificationReadVisitor } from './visitors/notification-read-visitor';

/**
 * Defines unit tests for the Visitor pattern integration.
 *
 * @returns {void}
 */
function defineVisitorTests(): void {
  /**
   * Creates a notification instance with deterministic fields.
   *
   * @param {number} id - Identifier used for the text field.
   * @param {boolean} isRead - Initial read flag.
   * @returns {Notification} Notification instance.
   */
  function createNotification(id: number, isRead: boolean): Notification {
    const notification = new Notification();
    notification.text = `#${id}`;
    notification.isRead = isRead;
    notification.link = null;
    return notification;
  }

  /**
   * Validates that `accept()` applies a visitor to every item.
   *
   * Given: three notifications with mixed `isRead` flags, visitor marks read.
   * Expect: all items have `isRead === true`.
   *
   * @returns {void}
   */
  function shouldApplyVisitorToAllItems(): void {
    const items = [
      createNotification(1, false),
      createNotification(2, false),
      createNotification(3, true),
    ];

    const collection = new NotificationsCollection(items);

    const visitor = new NotificationReadVisitor();
    collection.accept(visitor);

    expect(collection.pluck('isRead').all()).toEqual([true, true, true]);
  }

  /**
   * Validates that visitor mutations on observable entities are forwarded into collection events.
   *
   * Given: subscribe to collection events, run visitor that sets `isRead` to true.
   * Expect: one `EntityEvent.Updated` per entity with change payload for `isRead`.
   *
   * @returns {void}
   */
  function shouldForwardVisitorEntityMutationsIntoEvents(): void {
    const items = [createNotification(1, false), createNotification(2, false)];
    const collection = new NotificationsCollection(items);

    const events: Array<CollectionEvent<Notification>> = [];

    /**
     * Collects collection events for assertions.
     *
     * @param {CollectionEvent<Notification>} event - Collection event.
     * @returns {void}
     */
    function onCollectionEvent(event: CollectionEvent<Notification>): void {
      events.push(event);
    }

    const subscription = collection.subscribe(onCollectionEvent);

    collection.accept(new NotificationReadVisitor());

    // Each entity mutation should emit a single `EntityEvent.Updated` on the collection stream.
    const updatedEvents: Array<CollectionEvent<Notification>> = [];
    for (const event of events) {
      if (event.type === EntityEvent.Updated) {
        updatedEvents.push(event);
      }
    }

    expect(updatedEvents).toHaveLength(2);

    for (const event of updatedEvents) {
      if (event.type !== EntityEvent.Updated) {
        throw new Error('Expected only updated events in the filtered list.');
      }
      expect(event.payload.change.property).toBe('isRead');
      expect(event.payload.change.oldValue).toBe(false);
      expect(event.payload.change.newValue).toBe(true);
    }

    subscription.unsubscribe();
  }

  it('applies a visitor to all items', shouldApplyVisitorToAllItems);
  it(
    'forwards visitor entity mutations into events',
    shouldForwardVisitorEntityMutationsIntoEvents,
  );
}

describe('Visitor integration', defineVisitorTests);
