import { BaseCollection } from '../collections/base-collection';

/**
 * Row type used for filter method tests.
 */
interface IUserRow {
  /** User identifier. */
  id: number;
  /** User role. */
  role: 'admin' | 'manager' | 'user';
  /** Account status. */
  status: 'active' | 'blocked' | 'pending';
  /** Age in years. */
  age: number;
  /** Soft-delete marker. */
  deletedAt: Date | null;
}

/**
 * Defines unit tests for `BaseCollection` filter-style methods.
 *
 * @returns {void}
 */
function defineCollectionFilterTests(): void {
  /**
   * Creates a mock user dataset for deterministic assertions.
   *
   * @returns {IUserRow[]} Mock users.
   */
  function createMockUsers(): IUserRow[] {
    return [
      {
        id: 1,
        role: 'admin',
        status: 'active',
        age: 34,
        deletedAt: null,
      },
      {
        id: 2,
        role: 'user',
        status: 'blocked',
        age: 17,
        deletedAt: null,
      },
      {
        id: 3,
        role: 'manager',
        status: 'active',
        age: 24,
        deletedAt: new Date('2020-01-01T00:00:00.000Z'),
      },
      {
        id: 4,
        role: 'user',
        status: 'pending',
        age: 28,
        deletedAt: null,
      },
    ];
  }

  /**
   * Validates that `where()` works and returns a chainable collection instance.
   *
   * Given: mock users with mixed statuses; filter `status === 'active'`.
   * Expect: IDs [1,3] and returned type `BaseCollection`.
   *
   * @returns {void}
   */
  function shouldFilterWithWhere(): void {
    const users = createMockUsers();
    const collection = new BaseCollection<IUserRow>(users);

    const active = collection.where('status', 'active');

    expect(active).toBeInstanceOf(BaseCollection);
    expect(active.pluck('id').all()).toEqual([1, 3]);
  }

  /**
   * Validates that `where()` supports operator-based comparisons.
   *
   * Given: mock users with ages; filter `age >= 18`.
   * Expect: IDs [1,3,4].
   *
   * @returns {void}
   */
  function shouldFilterWithWhereOperators(): void {
    const users = createMockUsers();
    const collection = new BaseCollection<IUserRow>(users);

    const adults = collection.where('age', '>=', 18);

    expect(adults.pluck('id').all()).toEqual([1, 3, 4]);
  }

  /**
   * Validates `whereIn()` and `whereNotIn()` filters.
   *
   * Given: roles mixed across admin/manager/user.
   * Expect: `whereIn(['admin','manager'])` yields IDs [1,3]; `whereNotIn(['user'])` yields [1,3].
   *
   * @returns {void}
   */
  function shouldFilterWithWhereInAndWhereNotIn(): void {
    const users = createMockUsers();
    const collection = new BaseCollection<IUserRow>(users);

    const adminsAndManagers = collection.whereIn('role', ['admin', 'manager']);
    expect(adminsAndManagers.pluck('id').all()).toEqual([1, 3]);

    const notUsers = collection.whereNotIn('role', ['user']);
    expect(notUsers.pluck('id').all()).toEqual([1, 3]);
  }

  /**
   * Validates `whereNull()` and `whereNotNull()` filters.
   *
   * Given: dataset with `deletedAt` null for some users.
   * Expect: `whereNull` yields IDs [1,2,4]; `whereNotNull` yields [3].
   *
   * @returns {void}
   */
  function shouldFilterWithNullChecks(): void {
    const users = createMockUsers();
    const collection = new BaseCollection<IUserRow>(users);

    const notDeleted = collection.whereNull('deletedAt');
    expect(notDeleted.pluck('id').all()).toEqual([1, 2, 4]);

    const deleted = collection.whereNotNull('deletedAt');
    expect(deleted.pluck('id').all()).toEqual([3]);
  }

  /**
   * Validates that calling `filter()` without a predicate removes falsy values.
   *
   * Given: array containing falsy and truthy values.
   * Expect: result equals `[1, true, 'x']`.
   *
   * @returns {void}
   */
  function shouldRemoveFalsyValuesWhenFilterHasNoPredicate(): void {
    type Value = string | number | boolean | null | undefined;

    const values: Value[] = [0, 1, false, true, '', 'x', null, undefined];
    const collection = new BaseCollection<Value>(values);

    const truthy = collection.filter();

    expect(truthy.all()).toEqual([1, true, 'x']);
  }

  it('filters with where', shouldFilterWithWhere);
  it('filters with where operators', shouldFilterWithWhereOperators);
  it('filters with whereIn/whereNotIn', shouldFilterWithWhereInAndWhereNotIn);
  it('filters with null checks', shouldFilterWithNullChecks);
  it(
    'removes falsy values via filter()',
    shouldRemoveFalsyValuesWhenFilterHasNoPredicate,
  );
}

describe('BaseCollection filters', defineCollectionFilterTests);
