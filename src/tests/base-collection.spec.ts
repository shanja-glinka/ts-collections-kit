import { BaseCollection } from '../collections/base-collection';
import { EntityEvent } from '../observers/observable.interface';
import type { CollectionEvent } from '../observers/collection-events';
import { TestEntity } from './helpers/test-entity';

/**
 * Defines `BaseCollection` unit tests.
 *
 * Each test documents:
 * - given input/setup
 * - expected output/result
 *
 * @returns {void}
 */
function defineBaseCollectionTests(): void {
  /**
   * Validates that `BaseCollection` keeps the full runtime API from `collect.js`.
   *
   * Given: a numeric collection and a call to `skip`.
   * Expect: returned instance is `BaseCollection` and items are shifted.
   *
   * @returns {void}
   */
  function shouldKeepCollectJsRuntimeMethods(): void {
    const collection = new BaseCollection<number>([1, 2, 3, 4]);

    // `skip` is a `collect.js` method. It must exist and return a collection instance.
    const skipped = collection.skip(2);

    expect(skipped).toBeInstanceOf(BaseCollection);
    expect(skipped.all()).toEqual([3, 4]);
  }

  /**
   * Validates that entity property changes are forwarded into collection events.
   *
   * Given: observable entity in the collection; we mutate `foo`.
   * Expect: collection emits an `Updated` event containing the entity and change payload.
   *
   * @returns {void}
   */
  function shouldForwardEntityPropertyEvents(): void {
    const entity = new TestEntity();
    const collection = new BaseCollection<TestEntity>([entity]);

    const events: Array<CollectionEvent<TestEntity>> = [];

    /**
     * Collects collection events for later assertions.
     *
     * @param {CollectionEvent<TestEntity>} event - Collection event.
     * @returns {void}
     */
    function onCollectionEvent(event: CollectionEvent<TestEntity>): void {
      events.push(event);
    }

    const sub = collection.subscribe(onCollectionEvent);

    entity.foo = 'x';

    /**
     * Predicate used to locate the entity "updated" event inside the collected events array.
     *
     * @param {CollectionEvent<TestEntity>} event - Collection event.
     * @returns {boolean} True if the event represents an entity update.
     */
    function isEntityUpdatedEvent(event: CollectionEvent<TestEntity>): boolean {
      return event.type === EntityEvent.Updated;
    }

    const updatedEvent = events.find(isEntityUpdatedEvent);
    if (!updatedEvent || updatedEvent.type !== EntityEvent.Updated) {
      throw new Error('Expected an updated entity event.');
    }

    expect(updatedEvent.payload.item).toBe(entity);
    expect(updatedEvent.payload.change).toMatchObject({
      property: 'foo',
      oldValue: undefined,
      newValue: 'x',
    });

    sub.unsubscribe();
  }

  /**
   * Validates snapshot + rollback for collection mutations.
   *
   * Given: snapshots enabled, items [1,2]; add 3 then rollback.
   * Expect: after rollback items restore to [1,2].
   *
   * @returns {void}
   */
  function shouldRollbackToPreviousSnapshot(): void {
    const collection = new BaseCollection<number>([1, 2], {
      enableSnapshots: true,
    });

    collection.add(3);
    expect(collection.all()).toEqual([1, 2, 3]);

    collection.rollback();
    expect(collection.all()).toEqual([1, 2]);
  }

  /**
   * Validates transaction rollback restores the initial state.
   *
   * Given: transactions enabled, start tx with [1,2], add 3 and 4.
   * Expect: rollbackTransaction restores [1,2].
   *
   * @returns {void}
   */
  function shouldRollbackTransactionToInitialState(): void {
    const collection = new BaseCollection<number>([1, 2], {
      enableSnapshots: true,
      enableTransactions: true,
    });

    collection.beginTransaction();
    collection.add(3);
    collection.add(4);

    collection.rollbackTransaction();
    expect(collection.all()).toEqual([1, 2]);
  }

  /**
   * Validates `map` and `filter` return `BaseCollection` instances.
   *
   * Given: map doubles values, filter without predicate removes falsy.
   * Expect: both return `BaseCollection` and contain transformed arrays.
   *
   * @returns {void}
   */
  function shouldReturnBaseCollectionFromMapAndFilter(): void {
    const collection = new BaseCollection<number>([0, 1, 2]);

    /**
     * Doubles a number.
     *
     * @param {number} value - Number to transform.
     * @returns {number} Doubled number.
     */
    function double(value: number): number {
      return value * 2;
    }

    const mapped = collection.map(double);
    expect(mapped).toBeInstanceOf(BaseCollection);
    expect(mapped.all()).toEqual([0, 2, 4]);

    const filteredFalsyRemoved = collection.filter();
    expect(filteredFalsyRemoved.all()).toEqual([1, 2]);
  }

  /**
   * Validates that snapshot rollback restores entity state without replacing entity instances.
   *
   * Given: snapshots enabled, mutate entity twice then rollback.
   * Expect: same entity instance remains and field rolls back to previous value.
   *
   * @returns {void}
   */
  function shouldRollbackEntityStateWithoutReplacingInstances(): void {
    const entity = new TestEntity();
    const collection = new BaseCollection<TestEntity>([entity], {
      enableSnapshots: true,
    });

    const events: Array<CollectionEvent<TestEntity>> = [];

    /**
     * Collects collection events for assertions.
     *
     * @param {CollectionEvent<TestEntity>} event - Collection event.
     * @returns {void}
     */
    function onCollectionEvent(event: CollectionEvent<TestEntity>): void {
      events.push(event);
    }

    const subscription = collection.subscribe(onCollectionEvent);

    entity.foo = 'a';
    entity.foo = 'b';
    expect(entity.foo).toBe('b');

    // Rollback must revert to the previous snapshot state.
    collection.rollback();

    // The collection must keep the same instance reference.
    expect(collection.getItems()[0]).toBe(entity);
    expect(entity.foo).toBe('a');

    // Restore must not create extra entity events; only the rollback event is expected here.
    /**
     * Checks whether a collection event represents an entity update.
     *
     * @param {CollectionEvent<TestEntity>} event - Collection event.
     * @returns {boolean} True when the event is an entity update.
     */
    function isEntityUpdatedEvent(event: CollectionEvent<TestEntity>): boolean {
      return event.type === EntityEvent.Updated;
    }

    const updatedEventsAfterRollback: Array<CollectionEvent<TestEntity>> = [];
    for (const event of events) {
      if (isEntityUpdatedEvent(event)) {
        updatedEventsAfterRollback.push(event);
      }
    }
    expect(updatedEventsAfterRollback.length).toBe(2);

    subscription.unsubscribe();
  }

  /**
   * Validates that transaction rollback restores entity state and structure.
   *
   * Given: transaction enabled, mutate entity inside transaction then rollbackTransaction.
   * Expect: same entity instance, field reset.
   *
   * @returns {void}
   */
  function shouldRollbackEntityStateInsideTransaction(): void {
    const entity = new TestEntity();
    const collection = new BaseCollection<TestEntity>([entity], {
      enableSnapshots: true,
      enableTransactions: true,
    });

    collection.beginTransaction();

    entity.foo = 'tx';
    expect(entity.foo).toBe('tx');

    collection.rollbackTransaction();

    // The entity instance must stay the same, and the tracked field must be restored.
    expect(collection.getItems()[0]).toBe(entity);
    expect(entity.foo).toBeUndefined();
  }

  /**
   * Validates that enabling transactions is required for `beginTransaction()`.
   *
   * Given: collection with transactions disabled.
   * Expect: calling `beginTransaction()` throws the configured error message.
   *
   * @returns {void}
   */
  function shouldThrowWhenTransactionsDisabled(): void {
    const collection = new BaseCollection<number>([1, 2], {
      enableTransactions: false,
      enableSnapshots: false,
    });

    let errorMessage = '';
    try {
      collection.beginTransaction();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    expect(errorMessage).toBe('Transactions are disabled for this collection.');
  }

  /**
   * Validates that committing without an active transaction throws.
   *
   * Given: collection with transactions enabled but no active transaction.
   * Expect: `commitTransaction()` throws the configured error message.
   *
   * @returns {void}
   */
  function shouldThrowWhenCommittingWithoutActiveTransaction(): void {
    const collection = new BaseCollection<number>([1], {
      enableTransactions: true,
    });

    let errorMessage = '';
    try {
      collection.commitTransaction();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    expect(errorMessage).toBe('No active transaction to commit.');
  }

  it('keeps collect.js runtime methods', shouldKeepCollectJsRuntimeMethods);
  it('forwards entity property events', shouldForwardEntityPropertyEvents);
  it('rolls back to previous snapshot', shouldRollbackToPreviousSnapshot);
  it(
    'rolls back transactions to initial state',
    shouldRollbackTransactionToInitialState,
  );
  it(
    'returns BaseCollection from map/filter',
    shouldReturnBaseCollectionFromMapAndFilter,
  );
  it(
    'rolls back entity state without replacing instances',
    shouldRollbackEntityStateWithoutReplacingInstances,
  );
  it(
    'rolls back entity state inside transactions',
    shouldRollbackEntityStateInsideTransaction,
  );
  it(
    'throws when transactions are disabled',
    shouldThrowWhenTransactionsDisabled,
  );
  it(
    'throws when committing without an active transaction',
    shouldThrowWhenCommittingWithoutActiveTransaction,
  );
}

describe('BaseCollection', defineBaseCollectionTests);
