import { Collection } from 'collect.js';
import type { CollectionKey } from 'collect.js';
import { Subject, Subscription } from 'rxjs';
import { IObservable } from '../contracts/observable.contract';
import { IVisitor } from '../contracts/visitor.contract';
import { ICollectionOptions } from '../interfaces/collection-options.interface';
import { CollectionEvent } from '../observers/collection-events';
import {
  EntityEvent,
  type IObservableEvent,
  type IPropertyEvent,
} from '../observers/observable.interface';
import { ICollection } from './collection.contract';

/**
 * Snapshot of a single item state captured from a snapshot-capable entity.
 *
 * @template TItem - Item type.
 */
interface IItemSnapshot<TItem> {
  /** Item instance at the time of the snapshot. */
  item: TItem;
  /** Snapshot object produced by the item. */
  snapshot: Readonly<Record<string, unknown>>;
}

/**
 * Collection snapshot entry (Memento).
 *
 * This snapshot is designed to be safe with observable entities:
 * - the item list is stored by reference (structural rollback)
 * - snapshot-capable entities provide their own state mementos (property rollback without replacing instances)
 *
 * @template TItem - Item type.
 */
interface ICollectionSnapshot<TItem> {
  /** Snapshot token (timestamp in milliseconds). */
  token: number;
  /** Item list captured at snapshot time. */
  items: TItem[];
  /** Per-item state snapshots for snapshot-capable items. */
  itemSnapshots: Array<IItemSnapshot<TItem>>;
}

/**
 * `BaseCollection` is a Laravel-like collection (powered by `collect.js`) that adds:
 * - snapshots (Memento)
 * - transactions
 * - event stream (Observer via RxJS)
 * - visitors (Visitor pattern)
 *
 * @template T - Collection item type.
 */
export class BaseCollection<T> extends Collection<T> implements ICollection<T> {
  /** Collection options controlling snapshots and transactions. */
  protected options: Required<ICollectionOptions>;

  /**
   * Global snapshot history.
   *
   * Each snapshot is identified by a token (timestamp in milliseconds).
   */
  protected history: Array<ICollectionSnapshot<T>> = [];

  /** Whether a transaction is currently active. */
  protected transactionActive = false;
  /** Current transaction token (timestamp in milliseconds). */
  protected transactionToken: number | null = null;
  /** Initial state captured at `beginTransaction()` for rollback. */
  protected transactionInitialState: ICollectionSnapshot<T> | null = null;

  /** RxJS subject that emits collection events (Observer pattern). */
  protected eventsSubject = new Subject<CollectionEvent<T>>();
  /** Subscriptions to entity observables inside the collection. */
  protected entitySubscriptions: Subscription[] = [];

  /**
   * Creates a collection instance.
   *
   * @param {readonly T[] | undefined} initialItems - Initial collection items.
   * @param {ICollectionOptions | undefined} options - Snapshot/transaction options.
   */
  constructor(initialItems?: readonly T[], options?: ICollectionOptions) {
    super(initialItems ?? []);

    this.options = {
      enableSnapshots: options?.enableSnapshots ?? false,
      enableTransactions: options?.enableTransactions ?? false,
    };

    // Subscribe to observable entities (when present) in the initial set.
    for (const item of initialItems ?? []) {
      this.subscribeToItem(item);
    }
  }

  /**
   * Type guard that checks whether a value implements the `IObservable` contract.
   *
   * @param {unknown} value - Value to inspect.
   * @returns {value is IObservable} True if the value looks like an observable entity.
   */
  private isObservableEntity(value: unknown): value is IObservable {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const getEntityObservable: unknown = Reflect.get(
      value,
      'getEntityObservable',
    );
    const getPropertyObservable: unknown = Reflect.get(
      value,
      'getPropertyObservable',
    );

    return (
      typeof getEntityObservable === 'function' &&
      typeof getPropertyObservable === 'function'
    );
  }

  /**
   * Unsubscribes from all entity subscriptions created by this collection.
   *
   * @returns {void}
   */
  private unsubscribeFromAllEntities(): void {
    for (const subscription of this.entitySubscriptions) {
      subscription.unsubscribe();
    }
    this.entitySubscriptions = [];
  }

  /**
   * Re-subscribes to observables for all current items.
   *
   * This is used after bulk state replacements (rollback, transaction rollback) to avoid leaking
   * subscriptions and to prevent duplicate event forwarding.
   *
   * @returns {void}
   */
  private resubscribeToAllItems(): void {
    this.unsubscribeFromAllEntities();
    for (const item of this.all()) {
      this.subscribeToItem(item);
    }
  }

  /**
   * Subscribes to observable entity events and forwards them to the collection event stream.
   *
   * @param {T} item - Collection item to subscribe to.
   * @returns {void}
   */
  private subscribeToItem(item: T): void {
    if (!this.isObservableEntity(item)) {
      return;
    }

    const collection = this;

    /**
     * Forwards entity property change events into the collection event stream.
     *
     * @param {IPropertyEvent} eventData - Entity property event.
     * @returns {void}
     */
    function onPropertyEvent(eventData: IPropertyEvent): void {
      // Forward property change events to the collection stream.
      collection.eventsSubject.next({
        type: eventData.event,
        payload: { item, change: eventData.payload },
      });
    }

    const propertySubscription = item
      .getPropertyObservable()
      .subscribe(onPropertyEvent);

    /**
     * Tracks entity lifecycle updates to create pre-mutation snapshots.
     *
     * @param {IObservableEvent<unknown>} eventData - Entity lifecycle event.
     * @returns {void}
     */
    function onLifecycleEvent(eventData: IObservableEvent<unknown>): void {
      // Take a snapshot BEFORE an entity mutation (outside of a transaction) when snapshots are enabled.
      if (
        eventData.event === EntityEvent.Updating &&
        !collection.transactionActive &&
        collection.options.enableSnapshots
      ) {
        collection.snapshot();
      }
    }

    const lifecycleSubscription = item
      .getEntityObservable()
      .subscribe(onLifecycleEvent);

    this.entitySubscriptions.push(propertySubscription, lifecycleSubscription);
  }

  /**
   * Type guard verifying that an item supports snapshot capture and restore.
   *
   * @param {unknown} value - Value to inspect.
   * @returns {value is { captureSnapshot: () => Readonly<Record<string, unknown>>; restoreSnapshot: (snapshot: Readonly<Record<string, unknown>>) => void }} True when the item exposes snapshot methods.
   */
  private isSnapshotCapableItem(value: unknown): value is {
    captureSnapshot: () => Readonly<Record<string, unknown>>;
    restoreSnapshot: (snapshot: Readonly<Record<string, unknown>>) => void;
  } {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const capture: unknown = Reflect.get(value, 'captureSnapshot');
    const restore: unknown = Reflect.get(value, 'restoreSnapshot');

    return typeof capture === 'function' && typeof restore === 'function';
  }

  /**
   * Captures the current collection state into a snapshot entry.
   *
   * @param {number} token - Snapshot token.
   * @returns {ICollectionSnapshot<T>} Snapshot entry.
   */
  private captureCollectionSnapshot(token: number): ICollectionSnapshot<T> {
    const items = Array.from(this.all());
    const itemSnapshots: Array<IItemSnapshot<T>> = [];

    for (const item of items) {
      if (this.isSnapshotCapableItem(item)) {
        itemSnapshots.push({ item, snapshot: item.captureSnapshot() });
      }
    }

    return { token, items, itemSnapshots };
  }

  /**
   * Restores item snapshots for snapshot-capable items.
   *
   * @param {readonly IItemSnapshot<T>[]} itemSnapshots - Item snapshots.
   * @returns {void}
   */
  private restoreItemSnapshots(
    itemSnapshots: readonly IItemSnapshot<T>[],
  ): void {
    for (const entry of itemSnapshots) {
      if (this.isSnapshotCapableItem(entry.item)) {
        entry.item.restoreSnapshot(entry.snapshot);
      }
    }
  }

  /**
   * Replaces the internal items array used by `collect.js`.
   *
   * @param {readonly T[]} nextItems - New items to set.
   * @returns {void}
   */
  private replaceItems(nextItems: readonly T[]): void {
    Reflect.set(this, 'items', Array.from(nextItems));
    this.resubscribeToAllItems();
  }

  /**
   * Returns all items of the collection.
   *
   * @returns {T[]} Current items.
   */
  public getItems(): T[] {
    return this.all();
  }

  /**
   * Creates a snapshot of the current collection state (Memento pattern).
   *
   * @returns {void}
   */
  protected snapshot(): void {
    if (!this.options.enableSnapshots) {
      return;
    }

    const token = Date.now();
    const entry = this.captureCollectionSnapshot(token);
    this.history.push(entry);
  }

  /**
   * Clears the global snapshot history.
   *
   * @returns {void}
   */
  protected resetSnapshot(): void {
    this.history = [];
  }

  /**
   * Begins a transaction.
   *
   * The initial state is captured for `rollbackTransaction()`.
   *
   * @returns {number} Transaction token (timestamp in milliseconds).
   * @throws {Error} If transactions are disabled or a transaction is already active.
   */
  public beginTransaction(): number {
    if (!this.options.enableTransactions) {
      throw new Error('Transactions are disabled for this collection.');
    }
    if (this.transactionActive) {
      throw new Error('A transaction is already active.');
    }

    this.transactionActive = true;
    this.transactionToken = Date.now();
    this.transactionInitialState = this.captureCollectionSnapshot(
      this.transactionToken,
    );

    return this.transactionToken;
  }

  /**
   * Commits the active transaction and optionally records a snapshot.
   *
   * @returns {number} Committed transaction token.
   * @throws {Error} If transactions are disabled or there is no active transaction.
   */
  public commitTransaction(): number {
    if (!this.options.enableTransactions) {
      throw new Error('Transactions are disabled for this collection.');
    }
    if (!this.transactionActive || this.transactionToken === null) {
      throw new Error('No active transaction to commit.');
    }

    const token = this.transactionToken;

    // Record the final state in snapshot history, when enabled.
    if (this.options.enableSnapshots) {
      this.history.push(this.captureCollectionSnapshot(token));
    }

    // Reset transaction state.
    this.transactionActive = false;
    this.transactionToken = null;
    this.transactionInitialState = null;

    this.eventsSubject.next({
      type: 'commit',
      payload: { state: this.all(), token },
    });

    return token;
  }

  /**
   * Rolls back the active transaction to the initial captured state.
   *
   * @returns {void}
   * @throws {Error} If transactions are disabled or there is no active transaction.
   */
  public rollbackTransaction(): void {
    if (!this.options.enableTransactions) {
      throw new Error('Transactions are disabled for this collection.');
    }
    if (!this.transactionActive) {
      throw new Error('No active transaction to roll back.');
    }

    // Restore the state captured at `beginTransaction()`.
    if (this.transactionInitialState) {
      this.replaceItems(this.transactionInitialState.items);
      this.restoreItemSnapshots(this.transactionInitialState.itemSnapshots);
    }

    // Reset transaction state.
    this.transactionActive = false;
    this.transactionToken = null;
    this.transactionInitialState = null;

    this.eventsSubject.next({ type: 'rollback', payload: this.all() });
  }

  /**
   * Adds an item to the collection.
   *
   * When snapshots are enabled and no transaction is active, a snapshot is created before mutation.
   *
   * @param {T} item - Item to add.
   * @returns {void}
   */
  public add(item: T): void {
    if (!this.transactionActive && this.options.enableSnapshots) {
      this.snapshot();
    }

    this.push(item);
    this.eventsSubject.next({ type: 'add', payload: item });
    this.subscribeToItem(item);
  }

  /**
   * Removes an item from the collection.
   *
   * When snapshots are enabled and no transaction is active, a snapshot is created before mutation.
   *
   * @param {T} item - Item to remove.
   * @returns {void}
   */
  public remove(item: T): void {
    if (!this.transactionActive && this.options.enableSnapshots) {
      this.snapshot();
    }

    const nextItems: T[] = [];
    for (const currentItem of this.all()) {
      if (currentItem !== item) {
        nextItems.push(currentItem);
      }
    }

    this.replaceItems(nextItems);
    this.eventsSubject.next({ type: 'remove', payload: item });
  }

  /**
   * Commits changes outside a transaction.
   *
   * If a transaction is active, this delegates to `commitTransaction()`.
   *
   * @returns {void}
   */
  public commit(): void {
    if (this.transactionActive) {
      this.commitTransaction();
      return;
    }

    // Outside transactions: "commit" means resetting snapshot history.
    this.resetSnapshot();
    this.eventsSubject.next({
      type: 'commit',
      payload: { state: this.all() },
    });
  }

  /**
   * Rolls back the last snapshot (outside a transaction).
   *
   * @returns {void}
   */
  public rollback(): void {
    if (this.history.length === 0) {
      return;
    }

    const lastSnapshot = this.history.pop();
    if (!lastSnapshot) {
      return;
    }

    this.replaceItems(lastSnapshot.items);
    this.restoreItemSnapshots(lastSnapshot.itemSnapshots);
    this.eventsSubject.next({ type: 'rollback', payload: this.all() });
  }

  /**
   * Applies a visitor to all items (Visitor pattern).
   *
   * @param {IVisitor<T>} visitor - Visitor instance.
   * @returns {void}
   */
  public accept(visitor: IVisitor<T>): void {
    for (const item of this.all()) {
      visitor.visit(item);
    }
  }

  /**
   * Subscribes to collection events (Observer pattern).
   *
   * @param {(event: CollectionEvent<T>) => void} callback - Event callback.
   * @returns {Subscription} Subscription instance.
   */
  public subscribe(
    callback: (event: CollectionEvent<T>) => void,
  ): Subscription {
    return this.eventsSubject.subscribe(callback);
  }

  /**
   * Maps items into a new `BaseCollection`.
   *
   * @template U
   * @param {(item: T, key: CollectionKey) => U} callback - Mapping function.
   * @returns {BaseCollection<U>} New collection containing mapped items.
   */
  public override map<U>(
    callback: (item: T, key: CollectionKey) => U,
  ): BaseCollection<U> {
    const mapped = super.map(callback);
    const newCollection = new BaseCollection<U>(mapped.all(), this.options);

    // If both features are enabled, attach a snapshot to the derived collection for traceability.
    if (this.options.enableTransactions && this.options.enableSnapshots) {
      newCollection.history.push(
        newCollection.captureCollectionSnapshot(Date.now()),
      );
    }

    return newCollection;
  }

  /**
   * Filters items into a new `BaseCollection`.
   *
   * When no predicate is provided, the runtime removes "falsy" values (matches `collect.js` behavior).
   *
   * @param {(item: T, key: CollectionKey) => boolean | undefined} [predicate] - Filtering predicate.
   * @returns {BaseCollection<T>} New collection containing filtered items.
   */
  public override filter(): BaseCollection<T>;
  public override filter(
    predicate: (item: T, key: CollectionKey) => boolean,
  ): BaseCollection<T>;
  public override filter(
    predicate?: (item: T, key: CollectionKey) => boolean,
  ): BaseCollection<T> {
    const filtered = super.filter(predicate);
    const newCollection = new BaseCollection<T>(filtered.all(), this.options);

    // If both features are enabled, attach a snapshot to the derived collection for traceability.
    if (this.options.enableTransactions && this.options.enableSnapshots) {
      newCollection.history.push(
        newCollection.captureCollectionSnapshot(Date.now()),
      );
    }

    return newCollection;
  }

  /**
   * Reduces items to a single value.
   *
   * @template U
   * Note: when no initial value is provided, the runtime starts with `null`.
   *
   * @param {(carry: U | null, item: T, key: CollectionKey) => U} callback - Reducer function.
   * @param {U | undefined} [initial] - Optional initial accumulator value.
   * @returns {U | null} Reduced value.
   */
  public override reduce<U>(
    callback: (carry: U | null, item: T, key: CollectionKey) => U,
  ): U | null;
  public override reduce<U>(
    callback: (carry: U | null, item: T, key: CollectionKey) => U,
    initial: U,
  ): U;
  public override reduce<U>(
    callback: (carry: U | null, item: T, key: CollectionKey) => U,
    initial?: U,
  ): U | null {
    // When `initial` is not provided, `collect.js` starts the accumulator at `null`.
    if (initial === undefined) {
      return super.reduce(callback);
    }

    return super.reduce(callback, initial);
  }
}
