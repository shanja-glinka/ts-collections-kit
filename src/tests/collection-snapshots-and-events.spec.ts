import type {
  CollectionEvent,
  CollectionEventType,
} from '../observers/collection-events';
import { TestCollection } from './helpers/test-collection';

/**
 * Defines unit tests for snapshots, transactions, and collection-level events.
 *
 * @returns {void}
 */
function defineCollectionSnapshotsAndEventsTests(): void {
  /**
   * Collects event types from a list of events.
   *
   * @template T
   * @param {readonly CollectionEvent<T>[]} events - Event list.
   * @returns {CollectionEventType[]} Event types.
   */
  function collectEventTypes<T>(
    events: readonly CollectionEvent<T>[],
  ): CollectionEventType[] {
    const types: CollectionEventType[] = [];
    for (const event of events) {
      types.push(event.type);
    }
    return types;
  }

  /**
   * Finds the first event of a given type.
   *
   * @template T
   * @param {readonly CollectionEvent<T>[]} events - Event list.
   * @param {CollectionEventType} type - Target type.
   * @returns {CollectionEvent<T> | undefined} Matching event.
   */
  function findEventByType<T>(
    events: readonly CollectionEvent<T>[],
    type: CollectionEventType,
  ): CollectionEvent<T> | undefined {
    for (const event of events) {
      if (event.type === type) {
        return event;
      }
    }
    return undefined;
  }

  /**
   * Validates snapshot creation for `add` and `remove`, plus `commit()` behavior.
   *
   * Given: start with [1,2], snapshots enabled; add 3, remove 2, then commit.
   * Expect: snapshots created for add/remove, commit resets history and emits commit event with state [1,3].
   *
   * @returns {void}
   */
  function shouldCreateSnapshotsOnMutationsAndResetOnCommit(): void {
    const collection = new TestCollection<number>([1, 2], {
      enableSnapshots: true,
    });

    const events: Array<CollectionEvent<number>> = [];

    /**
     * Collects collection events for assertions.
     *
     * @param {CollectionEvent<number>} event - Collection event.
     * @returns {void}
     */
    function onCollectionEvent(event: CollectionEvent<number>): void {
      events.push(event);
    }

    const subscription = collection.subscribe(onCollectionEvent);

    expect(collection.getSnapshotCount()).toBe(0);

    collection.add(3);
    expect(collection.getSnapshotCount()).toBe(1);

    collection.remove(2);
    expect(collection.getSnapshotCount()).toBe(2);

    collection.commit();
    expect(collection.getSnapshotCount()).toBe(0);

    // When there are no snapshots left, rollback must be a no-op and should not emit a rollback event.
    collection.rollback();

    const types = collectEventTypes(events);
    expect(types).toEqual(['add', 'remove', 'commit']);

    const commitEvent = findEventByType(events, 'commit');
    if (!commitEvent || commitEvent.type !== 'commit') {
      throw new Error('Expected a commit event.');
    }

    expect(commitEvent.payload.state).toEqual([1, 3]);

    subscription.unsubscribe();
  }

  /**
   * Validates that transaction mutations do not create snapshots and that commit stores a final snapshot.
   *
   * Given: transaction with adds/removes, snapshots enabled.
   * Expect: no snapshots during transaction, one snapshot after commit, commit event includes token/state.
   *
   * @returns {void}
   */
  function shouldAvoidSnapshotsDuringTransactionAndStoreOnCommit(): void {
    const collection = new TestCollection<number>([1], {
      enableSnapshots: true,
      enableTransactions: true,
    });

    const events: Array<CollectionEvent<number>> = [];

    /**
     * Collects collection events for assertions.
     *
     * @param {CollectionEvent<number>} event - Collection event.
     * @returns {void}
     */
    function onCollectionEvent(event: CollectionEvent<number>): void {
      events.push(event);
    }

    const subscription = collection.subscribe(onCollectionEvent);

    const token = collection.beginTransaction();
    expect(collection.isTransactionActive()).toBe(true);

    collection.add(2);
    collection.add(3);
    collection.remove(1);

    // Transaction mutations should not create snapshots.
    expect(collection.getSnapshotCount()).toBe(0);

    const committedToken = collection.commitTransaction();
    expect(committedToken).toBe(token);
    expect(collection.isTransactionActive()).toBe(false);

    // Commit stores a snapshot when snapshots are enabled.
    expect(collection.getSnapshotCount()).toBe(1);

    const commitEvent = findEventByType(events, 'commit');
    if (!commitEvent || commitEvent.type !== 'commit') {
      throw new Error('Expected a commit event.');
    }

    expect(commitEvent.payload.token).toBe(token);
    expect(commitEvent.payload.state).toEqual([2, 3]);

    subscription.unsubscribe();
  }

  it(
    'creates snapshots on mutations and resets on commit',
    shouldCreateSnapshotsOnMutationsAndResetOnCommit,
  );
  it(
    'avoids snapshots during transactions and stores on commit',
    shouldAvoidSnapshotsDuringTransactionAndStoreOnCommit,
  );
}

describe(
  'BaseCollection snapshots and events',
  defineCollectionSnapshotsAndEventsTests,
);
