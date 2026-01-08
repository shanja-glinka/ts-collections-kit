/**
 * Strict, full type definitions for `collect.js` (used by this project).
 *
 * Goal:
 * - expose the complete `collect.js` API surface (methods present in `dist/index.js`)
 * - avoid unsafe types and broad assertions
 * - keep chaining ergonomics while remaining type-safe (use `unknown` when the library is dynamic)
 */
declare module 'collect.js' {
  /**
   * Comparison operators supported by `where` and related helpers.
   */
  export type Operator =
    | '==='
    | '=='
    | '!=='
    | '!='
    | '<>'
    | '>'
    | '<'
    | '>='
    | '<=';

  /**
   * Key type used by callbacks across array-like and object-like collections.
   */
  export type CollectionKey = string | number;

  /**
   * Callback used by predicate-style methods.
   *
   * @template T - Item type.
   */
  export type Predicate<T> = (item: T, key: CollectionKey) => boolean;

  /**
   * Callback used by map-style methods.
   *
   * @template T - Input item type.
   * @template U - Output item type.
   */
  export type MapCallback<T, U> = (item: T, key: CollectionKey) => U;

  /**
   * Callback used by reduce-style methods.
   *
   * @template T - Item type.
   * @template U - Accumulator type.
   */
  export type ReduceCallback<T, U> = (
    carry: U | null,
    item: T,
    key: CollectionKey,
  ) => U;

  /**
   * Comparator used by sort-style methods.
   *
   * @template T - Item type.
   */
  export type Comparator<T> = (a: T, b: T) => number;

  /**
   * Laravel-like collection implementation provided by `collect.js`.
   *
   * Note: The underlying runtime supports both array-like and object-like collections.
   * For most use-cases in this repository (entity lists), the collection is array-like.
   *
   * @template Item - Item type.
   */
  export class Collection<Item> implements Iterable<Item> {
    /**
     * Creates a collection.
     *
     * @param {unknown} collection - Initial collection value.
     */
    constructor(collection?: unknown);

    /**
     * Support `JSON.stringify()`.
     *
     * @returns {unknown} JSON representation of the underlying items.
     */
    toJSON(): unknown;

    /**
     * Returns the underlying items.
     *
     * @returns {Item[]} Items in an array (array-like collections).
     */
    all(): Item[];

    /**
     * Alias for `avg`.
     *
     * @param {keyof Item | string | undefined} key - Optional key selector.
     * @returns {number} Average value.
     */
    average(key?: keyof Item | string): number;

    /**
     * Returns the average of the items.
     *
     * @param {keyof Item | string | undefined} key - Optional key selector.
     * @returns {number} Average value.
     */
    avg(key?: keyof Item | string): number;

    /**
     * Breaks the collection into chunks.
     *
     * @param {number} size - Chunk size.
     * @returns {Collection<Collection<Item>>} Collection of chunk collections.
     */
    chunk(size: number): Collection<Collection<Item>>;

    /**
     * Collapses a collection of arrays/collections into a single collection.
     *
     * @returns {Collection<unknown>} Collapsed collection.
     */
    collapse(): Collection<unknown>;

    /**
     * Combines the keys of the collection with the values of another array.
     *
     * @template U
     * @param {readonly U[]} array - Values to combine.
     * @returns {Collection<U>} Combined collection.
     */
    combine<U>(array: readonly U[]): Collection<U>;

    /**
     * Concatenates another collection/array/object onto the current collection.
     *
     * @template U
     * @param {Collection<U> | readonly U[] | Record<string, U>} value - Value to concatenate.
     * @returns {Collection<Item | U>} Concatenated collection.
     */
    concat<U>(
      value: Collection<U> | readonly U[] | Record<string, U>,
    ): Collection<Item | U>;

    /**
     * Determines whether the collection contains a given item/value.
     *
     * @param {unknown} value - Value to search for.
     * @returns {boolean} Whether the collection contains the value.
     */
    contains(value: unknown): boolean;

    /**
     * Determines whether the collection contains an item where `item[key] === value`.
     *
     * @param {keyof Item | string} key - Property name (supports dot-notation in runtime).
     * @param {unknown} value - Expected value.
     * @returns {boolean} Whether a matching item exists.
     */
    contains(key: keyof Item | string, value: unknown): boolean;

    /**
     * Determines whether the collection contains an item that matches the predicate.
     *
     * @param {Predicate<Item>} predicate - Predicate function.
     * @returns {boolean} Whether a matching item exists.
     */
    contains(predicate: Predicate<Item>): boolean;

    /**
     * Returns true when the collection contains exactly one item.
     *
     * @returns {boolean} Whether the collection has exactly one item.
     */
    containsOneItem(): boolean;

    /**
     * Returns the number of items in the collection.
     *
     * @returns {number} Count.
     */
    count(): number;

    /**
     * Counts items by group key.
     *
     * @param {(item: Item, key: CollectionKey) => PropertyKey | undefined} [callback] - Grouping callback.
     * @returns {Collection<number>} Collection of counts keyed by group.
     */
    countBy(
      callback?: (item: Item, key: CollectionKey) => PropertyKey,
    ): Collection<number>;

    /**
     * Cross-joins the collection with the given values.
     *
     * @template U
     * @param {readonly U[]} values - Values to cross-join with.
     * @returns {Collection<readonly unknown[]>} Collection of permutations.
     */
    crossJoin<U>(values: readonly U[]): Collection<readonly unknown[]>;

    /**
     * Dumps the collection and exits the process.
     *
     * @returns {void}
     */
    dd(): void;

    /**
     * Returns the difference of values.
     *
     * @param {readonly Item[] | Collection<Item>} values - Values to diff against.
     * @returns {Collection<Item>} Diffed collection.
     */
    diff(values: readonly Item[] | Collection<Item>): Collection<Item>;

    /**
     * Returns the associative difference (keys and values).
     *
     * @param {Record<string, unknown> | Collection<unknown>} values - Values to diff against.
     * @returns {Collection<Item>} Diffed collection.
     */
    diffAssoc(
      values: Record<string, unknown> | Collection<unknown>,
    ): Collection<Item>;

    /**
     * Returns the difference of keys.
     *
     * @param {Record<string, unknown>} object - Object to diff keys against.
     * @returns {Collection<string>} Keys that differ.
     */
    diffKeys(object: Record<string, unknown>): Collection<string>;

    /**
     * Returns the difference using a custom comparator.
     *
     * @param {readonly Item[]} values - Values to compare against.
     * @param {(a: Item, b: Item) => number} comparator - Comparator that returns 0 when items are equal.
     * @returns {Collection<Item>} Diffed collection.
     */
    diffUsing(
      values: readonly Item[],
      comparator: (a: Item, b: Item) => number,
    ): Collection<Item>;

    /**
     * Inverse of `contains`.
     *
     * @param {unknown} value - Value to search for.
     * @returns {boolean} Whether the value does not exist.
     */
    doesntContain(value: unknown): boolean;

    /**
     * Inverse of key/value `contains`.
     *
     * @param {keyof Item | string} key - Property name (supports dot-notation in runtime).
     * @param {unknown} value - Expected value.
     * @returns {boolean} Whether no matching item exists.
     */
    doesntContain(key: keyof Item | string, value: unknown): boolean;

    /**
     * Inverse of predicate `contains`.
     *
     * @param {Predicate<Item>} predicate - Predicate function.
     * @returns {boolean} Whether no matching item exists.
     */
    doesntContain(predicate: Predicate<Item>): boolean;

    /**
     * Dumps the collection and continues (fluent).
     *
     * @returns {this} This collection.
     */
    dump(): this;

    /**
     * Returns the duplicated values (keyed by their original keys).
     *
     * @returns {Collection<Item>} Collection of duplicates.
     */
    duplicates(): Collection<Item>;

    /**
     * Iterates over each item.
     *
     * @param {(item: Item, key: CollectionKey) => void} callback - Iterator callback.
     * @returns {this} This collection.
     */
    each(callback: (item: Item, key: CollectionKey) => void): this;

    /**
     * Iterates over each item, spreading array-like items into arguments.
     *
     * @param {(...args: readonly unknown[]) => void} callback - Callback receiving spread values.
     * @returns {this} This collection.
     */
    eachSpread(callback: (...args: readonly unknown[]) => void): this;

    /**
     * Returns true if all items match the predicate.
     *
     * @param {Predicate<Item>} predicate - Predicate function.
     * @returns {boolean} Whether all items match.
     */
    every(predicate: Predicate<Item>): boolean;

    /**
     * Returns all items except those with the specified keys.
     *
     * @param {readonly (keyof Item | string)[]} keys - Keys to exclude.
     * @returns {Collection<Item>} New collection.
     */
    except(keys: readonly (keyof Item | string)[]): Collection<Item>;

    /**
     * Filters items by predicate. When no predicate is provided, removes "falsy" items.
     *
     * @param {Predicate<Item> | undefined} [predicate] - Predicate function.
     * @returns {Collection<Item>} Filtered collection.
     */
    filter(predicate?: Predicate<Item>): Collection<Item>;

    /**
     * Returns the first element matching the predicate (or the first item when no predicate is given).
     *
     * @returns {Item | undefined} First item or undefined.
     */
    first(): Item | undefined;

    /**
     * Returns the first element matching the predicate.
     *
     * @param {Predicate<Item>} predicate - Predicate function.
     * @returns {Item | undefined} First match or undefined.
     */
    first(predicate: Predicate<Item>): Item | undefined;

    /**
     * Returns the first element matching the predicate, falling back to a default.
     *
     * @template D
     * @param {Predicate<Item>} predicate - Predicate function.
     * @param {D | (() => D)} defaultValue - Default value or factory.
     * @returns {Item | D} First match or default value.
     */
    first<D>(predicate: Predicate<Item>, defaultValue: D | (() => D)): Item | D;

    /**
     * Returns the first element or a default.
     *
     * @template D
     * @param {D | (() => D)} defaultValue - Default value or factory.
     * @returns {Item | D} First item or default.
     */
    first<D>(defaultValue: D | (() => D)): Item | D;

    /**
     * Returns the first element or throws when empty.
     *
     * @returns {Item} First item.
     * @throws {Error} When the collection is empty.
     */
    firstOrFail(): Item;

    /**
     * Returns the first element matching a `where(...)` query.
     *
     * @param {keyof Item | string} key - Property name (supports dot-notation in runtime).
     * @param {Operator | unknown} operator - Operator or value.
     * @param {unknown} [value] - Comparison value.
     * @returns {Item | null} First match or null.
     */
    firstWhere(
      key: keyof Item | string,
      operator: Operator | unknown,
      value?: unknown,
    ): Item | null;

    /**
     * Maps items and flattens one level.
     *
     * @template U
     * @param {MapCallback<Item, U>} callback - Mapping callback.
     * @returns {Collection<unknown>} Flattened mapped collection.
     */
    flatMap<U>(callback: MapCallback<Item, U>): Collection<unknown>;

    /**
     * Flattens a multi-dimensional collection.
     *
     * @param {number | undefined} [depth] - Depth to flatten.
     * @returns {Collection<unknown>} Flattened collection.
     */
    flatten(depth?: number): Collection<unknown>;

    /**
     * Swaps keys and values.
     *
     * @returns {Collection<unknown>} Flipped collection.
     */
    flip(): Collection<unknown>;

    /**
     * Returns the items for a given "page" (page number and size).
     *
     * @param {number} page - Page number (1-based).
     * @param {number} size - Page size.
     * @returns {Collection<Item>} Paged collection.
     */
    forPage(page: number, size: number): Collection<Item>;

    /**
     * Removes an item by key.
     *
     * @param {keyof Item | string} key - Key to forget.
     * @returns {this} This collection.
     */
    forget(key: keyof Item | string): this;

    /**
     * Returns an item by key, or null when absent.
     *
     * @param {keyof Item | string} key - Key to get.
     * @returns {Item | null} Found item or null.
     */
    get(key: keyof Item | string): Item | null;

    /**
     * Returns an item by key, or a default when absent.
     *
     * @template D
     * @param {keyof Item | string} key - Key to get.
     * @param {D | (() => D)} defaultValue - Default value or factory.
     * @returns {Item | D} Found item or default.
     */
    get<D>(key: keyof Item | string, defaultValue: D | (() => D)): Item | D;

    /**
     * Groups items by a key or callback.
     *
     * @param {keyof Item | string | ((item: Item, key: CollectionKey) => PropertyKey)} key - Group key selector.
     * @returns {Collection<Collection<Item>>} Grouped collection.
     */
    groupBy(
      key:
        | keyof Item
        | string
        | ((item: Item, key: CollectionKey) => PropertyKey),
    ): Collection<Collection<Item>>;

    /**
     * Checks if the collection has a key (or keys).
     *
     * @param {keyof Item | string | readonly (keyof Item | string)[]} key - Key(s) to check.
     * @returns {boolean} Whether the key(s) exist.
     */
    has(key: keyof Item | string | readonly (keyof Item | string)[]): boolean;

    /**
     * Joins items into a string.
     *
     * @param {string} glue - Glue string.
     * @returns {string} Joined string.
     */
    implode(glue: string): string;

    /**
     * Joins item values for a given key.
     *
     * @param {keyof Item | string} key - Key to pluck.
     * @param {string | undefined} [glue] - Glue string.
     * @returns {string} Joined string.
     */
    implode(key: keyof Item | string, glue?: string): string;

    /**
     * Intersects by values.
     *
     * @param {readonly Item[] | Collection<Item>} values - Values to intersect.
     * @returns {Collection<Item>} Intersected collection.
     */
    intersect(values: readonly Item[] | Collection<Item>): Collection<Item>;

    /**
     * Intersects by keys.
     *
     * @param {Record<string, unknown> | Collection<unknown>} values - Values to intersect by keys.
     * @returns {Collection<Item>} Intersected collection.
     */
    intersectByKeys(
      values: Record<string, unknown> | Collection<unknown>,
    ): Collection<Item>;

    /**
     * Returns true if empty.
     *
     * @returns {boolean} Whether empty.
     */
    isEmpty(): boolean;

    /**
     * Returns true if not empty.
     *
     * @returns {boolean} Whether not empty.
     */
    isNotEmpty(): boolean;

    /**
     * Joins items with optional final glue.
     *
     * @param {string} glue - Glue string.
     * @param {string | undefined} [finalGlue] - Final glue string.
     * @returns {string} Joined string.
     */
    join(glue: string, finalGlue?: string): string;

    /**
     * Keys the collection by a given key/callback.
     *
     * @param {keyof Item | string | ((item: Item, key: CollectionKey) => PropertyKey)} key - Key selector.
     * @returns {Collection<Item>} Keyed collection.
     */
    keyBy(
      key:
        | keyof Item
        | string
        | ((item: Item, key: CollectionKey) => PropertyKey),
    ): Collection<Item>;

    /**
     * Returns all keys.
     *
     * @returns {Collection<string>} Keys collection.
     */
    keys(): Collection<string>;

    /**
     * Returns the last item (optionally matching a predicate).
     *
     * @param {Predicate<Item> | undefined} [predicate] - Predicate function.
     * @returns {Item | undefined} Last item or undefined.
     */
    last(predicate?: Predicate<Item>): Item | undefined;

    /**
     * Registers a macro (custom method).
     *
     * @param {string} name - Macro name.
     * @param {(...args: readonly unknown[]) => unknown} fn - Macro function.
     * @returns {void}
     */
    macro(name: string, fn: (...args: readonly unknown[]) => unknown): void;

    /**
     * Creates a new collection instance from a value.
     *
     * @template U
     * @param {unknown} [items] - Items.
     * @returns {Collection<U>} New collection.
     */
    make<U>(items?: unknown): Collection<U>;

    /**
     * Maps items into a new collection.
     *
     * @template U
     * @param {MapCallback<Item, U>} callback - Mapping callback.
     * @returns {Collection<U>} Mapped collection.
     */
    map<U>(callback: MapCallback<Item, U>): Collection<U>;

    /**
     * Instantiates a class for each item.
     *
     * @template TClass
     * @param {new (value: Item) => TClass} ClassName - Class constructor.
     * @returns {Collection<TClass>} Collection of instances.
     */
    mapInto<TClass>(ClassName: new (value: Item) => TClass): Collection<TClass>;

    /**
     * Maps items by spreading array-like items into the callback.
     *
     * @template U
     * @param {(...args: readonly unknown[]) => U} callback - Callback receiving spread values.
     * @returns {Collection<U>} Mapped collection.
     */
    mapSpread<U>(callback: (...args: readonly unknown[]) => U): Collection<U>;

    /**
     * Maps items into a dictionary keyed by the first element returned from the callback.
     *
     * @template TKey
     * @template TValue
     * @param {(item: Item, key: CollectionKey) => readonly [TKey, TValue]} callback - Callback returning key/value.
     * @returns {Collection<unknown>} Dictionary-like collection.
     */
    mapToDictionary<TKey extends PropertyKey, TValue>(
      callback: (item: Item, key: CollectionKey) => readonly [TKey, TValue],
    ): Collection<unknown>;

    /**
     * Maps items into groups.
     *
     * @param {(item: Item, key: CollectionKey) => readonly [PropertyKey, unknown]} callback - Callback returning group.
     * @returns {Collection<unknown>} Grouped collection.
     */
    mapToGroups(
      callback: (
        item: Item,
        key: CollectionKey,
      ) => readonly [PropertyKey, unknown],
    ): Collection<unknown>;

    /**
     * Maps items with custom keys.
     *
     * @template U
     * @param {(item: Item, key: CollectionKey) => readonly [PropertyKey, U]} callback - Callback returning key/value.
     * @returns {Collection<U>} Keyed collection.
     */
    mapWithKeys<U>(
      callback: (item: Item, key: CollectionKey) => readonly [PropertyKey, U],
    ): Collection<U>;

    /**
     * Returns the maximum value (optionally by key).
     *
     * @param {keyof Item | string | undefined} [key] - Key selector.
     * @returns {number} Maximum.
     */
    max(key?: keyof Item | string): number;

    /**
     * Returns the median value (optionally by key).
     *
     * @param {keyof Item | string | undefined} [key] - Key selector.
     * @returns {unknown} Median.
     */
    median(key?: keyof Item | string): unknown;

    /**
     * Merges an object/array into the collection.
     *
     * @param {unknown} value - Value to merge.
     * @returns {Collection<unknown>} Merged collection.
     */
    merge(value: unknown): Collection<unknown>;

    /**
     * Recursively merges an object/array into the collection.
     *
     * @param {unknown} value - Value to merge.
     * @returns {Collection<unknown>} Merged collection.
     */
    mergeRecursive(value: unknown): Collection<unknown>;

    /**
     * Returns the minimum value (optionally by key).
     *
     * @param {keyof Item | string | undefined} [key] - Key selector.
     * @returns {number} Minimum.
     */
    min(key?: keyof Item | string): number;

    /**
     * Returns the mode value (optionally by key).
     *
     * @param {keyof Item | string | undefined} [key] - Key selector.
     * @returns {Collection<unknown> | null} Mode values or null.
     */
    mode(key?: keyof Item | string): Collection<unknown> | null;

    /**
     * Returns every n-th element.
     *
     * @param {number} n - Step.
     * @param {number | undefined} [offset] - Offset.
     * @returns {Collection<Item>} Resulting collection.
     */
    nth(n: number, offset?: number): Collection<Item>;

    /**
     * Returns items only with the specified keys.
     *
     * @param {readonly (keyof Item | string)[]} keys - Keys to include.
     * @returns {Collection<Item>} Resulting collection.
     */
    only(keys: readonly (keyof Item | string)[]): Collection<Item>;

    /**
     * Pads the collection to the specified size with a value.
     *
     * @param {number} size - Target size.
     * @param {unknown} value - Pad value.
     * @returns {Collection<unknown>} Padded collection.
     */
    pad(size: number, value: unknown): Collection<unknown>;

    /**
     * Partitions items into two collections based on predicate.
     *
     * The runtime returns a collection of two collections (iterable for destructuring).
     *
     * @param {Predicate<Item>} predicate - Predicate function.
     * @returns {Collection<Collection<Item>>} Two-part partition.
     */
    partition(predicate: Predicate<Item>): Collection<Collection<Item>>;

    /**
     * Pipes the collection through a callback and returns the result.
     *
     * @template U
     * @param {(collection: Collection<Item>) => U} callback - Pipe callback.
     * @returns {U} Callback result.
     */
    pipe<U>(callback: (collection: Collection<Item>) => U): U;

    /**
     * Retrieves all values for a given key.
     *
     * @param {keyof Item | string} valueKey - Value key.
     * @returns {Collection<unknown>} Plucked values.
     */
    pluck(valueKey: keyof Item | string): Collection<unknown>;

    /**
     * Retrieves all values for a given key and keys them by another key.
     *
     * @param {keyof Item | string} valueKey - Value key.
     * @param {keyof Item | string} keyKey - Key key.
     * @returns {Collection<unknown>} Plucked values keyed by `keyKey`.
     */
    pluck(
      valueKey: keyof Item | string,
      keyKey: keyof Item | string,
    ): Collection<unknown>;

    /**
     * Removes and returns the last item.
     *
     * @returns {Item | undefined} Removed item.
     */
    pop(): Item | undefined;

    /**
     * Prepends a value to the collection.
     *
     * @param {unknown} value - Value to prepend.
     * @param {CollectionKey | undefined} [key] - Optional key for object-like collections.
     * @returns {this} This collection.
     */
    prepend(value: unknown, key?: CollectionKey): this;

    /**
     * Removes and returns an item by key.
     *
     * @param {CollectionKey} key - Key to pull.
     * @returns {Item | null} Removed item or null.
     */
    pull(key: CollectionKey): Item | null;

    /**
     * Pushes an item to the end (array-like collections).
     *
     * @param {Item} item - Item to push.
     * @returns {this} This collection.
     */
    push(item: Item): this;

    /**
     * Puts a key/value pair (object-like collections).
     *
     * @param {CollectionKey} key - Key to set.
     * @param {unknown} value - Value to set.
     * @returns {this} This collection.
     */
    put(key: CollectionKey, value: unknown): this;

    /**
     * Returns a random item.
     *
     * @returns {Item} Random item.
     */
    random(): Item;

    /**
     * Returns a collection of random items.
     *
     * @param {number} length - Number of items to return.
     * @returns {Collection<Item>} Random items.
     */
    random(length: number): Collection<Item>;

    /**
     * Reduces the collection to a value.
     *
     * Note: when no initial value is provided, the runtime starts with `null`.
     *
     * @template U
     * @param {ReduceCallback<Item, U>} callback - Reducer callback.
     * @returns {U | null} Reduced value.
     */
    reduce<U>(callback: ReduceCallback<Item, U>): U | null;

    /**
     * Reduces the collection to a value with an initial accumulator.
     *
     * @template U
     * @param {ReduceCallback<Item, U>} callback - Reducer callback.
     * @param {U} initial - Initial accumulator.
     * @returns {U} Reduced value.
     */
    reduce<U>(callback: ReduceCallback<Item, U>, initial: U): U;

    /**
     * Rejects items matching predicate (inverse of filter).
     *
     * @param {Predicate<Item>} predicate - Predicate function.
     * @returns {Collection<Item>} Resulting collection.
     */
    reject(predicate: Predicate<Item>): Collection<Item>;

    /**
     * Replaces items by key (non-recursive).
     *
     * @param {Record<string, unknown> | readonly unknown[]} values - Replacement values.
     * @returns {Collection<unknown>} Replaced collection.
     */
    replace(
      values: Record<string, unknown> | readonly unknown[],
    ): Collection<unknown>;

    /**
     * Replaces items by key (recursive).
     *
     * @param {Record<string, unknown> | readonly unknown[]} values - Replacement values.
     * @returns {Collection<unknown>} Replaced collection.
     */
    replaceRecursive(
      values: Record<string, unknown> | readonly unknown[],
    ): Collection<unknown>;

    /**
     * Reverses item order.
     *
     * @returns {Collection<Item>} Reversed collection.
     */
    reverse(): Collection<Item>;

    /**
     * Searches for a value or predicate.
     *
     * @param {unknown} valueOrPredicate - Value or predicate.
     * @param {boolean | undefined} [strict] - Strict mode for value search.
     * @returns {CollectionKey | false} Found key or false.
     */
    search(valueOrPredicate: unknown, strict?: boolean): CollectionKey | false;

    /**
     * Removes and returns the first item.
     *
     * @returns {Item | undefined} Removed item.
     */
    shift(): Item | undefined;

    /**
     * Shuffles items (in-place) and returns the collection.
     *
     * @returns {this} This collection.
     */
    shuffle(): this;

    /**
     * Skips the first `count` items.
     *
     * @param {number} count - Number of items to skip.
     * @returns {Collection<Item>} Resulting collection.
     */
    skip(count: number): Collection<Item>;

    /**
     * Skips items until a predicate returns true (or a value is found).
     *
     * @param {unknown} valueOrPredicate - Value or predicate.
     * @returns {Collection<Item>} Resulting collection.
     */
    skipUntil(valueOrPredicate: unknown): Collection<Item>;

    /**
     * Skips items while a predicate returns true.
     *
     * @param {Predicate<Item>} predicate - Predicate function.
     * @returns {Collection<Item>} Resulting collection.
     */
    skipWhile(predicate: Predicate<Item>): Collection<Item>;

    /**
     * Returns a slice of items.
     *
     * @param {number} start - Start index.
     * @param {number | undefined} [limit] - Optional limit.
     * @returns {Collection<Item>} Sliced collection.
     */
    slice(start: number, limit?: number): Collection<Item>;

    /**
     * Returns the single item matching the predicate, or throws when none/multiple match.
     *
     * @param {Predicate<Item> | undefined} [predicate] - Predicate function.
     * @returns {Item} The sole item.
     * @throws {Error} When none or multiple items match.
     */
    sole(predicate?: Predicate<Item>): Item;

    /**
     * Returns true when at least one item matches the predicate.
     *
     * @param {Predicate<Item>} predicate - Predicate function.
     * @returns {boolean} Whether at least one item matches.
     */
    some(predicate: Predicate<Item>): boolean;

    /**
     * Sorts the collection.
     *
     * @param {Comparator<Item> | undefined} [comparator] - Comparator function.
     * @returns {Collection<Item>} Sorted collection.
     */
    sort(comparator?: Comparator<Item>): Collection<Item>;

    /**
     * Sorts by a key.
     *
     * @param {keyof Item | string} key - Key selector.
     * @returns {Collection<Item>} Sorted collection.
     */
    sortBy(key: keyof Item | string): Collection<Item>;

    /**
     * Sorts by a callback.
     *
     * @param {(item: Item) => number} callback - Sort key selector.
     * @returns {Collection<Item>} Sorted collection.
     */
    sortBy(callback: (item: Item) => number): Collection<Item>;

    /**
     * Sorts by a key in descending order.
     *
     * @param {keyof Item | string} key - Key selector.
     * @returns {Collection<Item>} Sorted collection.
     */
    sortByDesc(key: keyof Item | string): Collection<Item>;

    /**
     * Sorts by a callback in descending order.
     *
     * @param {(item: Item) => number} callback - Sort key selector.
     * @returns {Collection<Item>} Sorted collection.
     */
    sortByDesc(callback: (item: Item) => number): Collection<Item>;

    /**
     * Sorts the collection in descending order (in-place).
     *
     * @param {Comparator<Item> | undefined} [comparator] - Comparator function.
     * @returns {Collection<Item>} Sorted collection.
     */
    sortDesc(comparator?: Comparator<Item>): Collection<Item>;

    /**
     * Sorts keys.
     *
     * @returns {Collection<Item>} Sorted collection.
     */
    sortKeys(): Collection<Item>;

    /**
     * Sorts keys in descending order.
     *
     * @returns {Collection<Item>} Sorted collection.
     */
    sortKeysDesc(): Collection<Item>;

    /**
     * Removes and returns a slice of items and optionally replaces them.
     *
     * @param {number} index - Start index.
     * @param {number} limit - Number of items to remove.
     * @param {readonly Item[] | undefined} [replace] - Optional replacement items.
     * @returns {Collection<Item>} Removed items collection.
     */
    splice(
      index: number,
      limit: number,
      replace?: readonly Item[],
    ): Collection<Item>;

    /**
     * Splits the collection into the given number of groups.
     *
     * @param {number} numberOfGroups - Number of groups.
     * @returns {Collection<Collection<Item>>} Group collections.
     */
    split(numberOfGroups: number): Collection<Collection<Item>>;

    /**
     * Returns the sum of items (optionally by key/callback).
     *
     * @param {keyof Item | string | ((item: Item) => number | string) | undefined} [key] - Key selector.
     * @returns {number | string} Sum.
     */
    sum(
      key?: keyof Item | string | ((item: Item) => number | string),
    ): number | string;

    /**
     * Takes the first `length` items (or the last when length is negative).
     *
     * @param {number} length - Number of items.
     * @returns {Collection<Item>} Taken items.
     */
    take(length: number): Collection<Item>;

    /**
     * Takes items until a predicate returns true (or a value is found).
     *
     * @param {unknown} valueOrPredicate - Value or predicate.
     * @returns {Collection<Item>} Taken items.
     */
    takeUntil(valueOrPredicate: unknown): Collection<Item>;

    /**
     * Takes items while a predicate returns true.
     *
     * @param {Predicate<Item>} predicate - Predicate function.
     * @returns {Collection<Item>} Taken items.
     */
    takeWhile(predicate: Predicate<Item>): Collection<Item>;

    /**
     * Taps into the collection and returns it (fluent).
     *
     * @param {(collection: Collection<Item>) => void} callback - Tap callback.
     * @returns {this} This collection.
     */
    tap(callback: (collection: Collection<Item>) => void): this;

    /**
     * Invokes a callback `n` times, pushing the returned values into the collection (mutates).
     *
     * @param {number} n - Times.
     * @param {(time: number) => Item} callback - Callback producing items.
     * @returns {this} This collection.
     */
    times(n: number, callback: (time: number) => Item): this;

    /**
     * Converts the collection to an array.
     *
     * @returns {unknown[]} Array representation.
     */
    toArray(): unknown[];

    /**
     * Converts the collection to a JSON string.
     *
     * @returns {string} JSON string.
     */
    toJson(): string;

    /**
     * Transforms items (mutates).
     *
     * @template U
     * @param {MapCallback<Item, U>} callback - Transform callback.
     * @returns {Collection<U>} Transformed collection.
     */
    transform<U>(callback: MapCallback<Item, U>): Collection<U>;

    /**
     * Undots a dotted-key object into a nested object.
     *
     * @returns {Collection<unknown>} Undotted collection.
     */
    undot(): Collection<unknown>;

    /**
     * Unions an object into the collection (prefers existing values for matching keys).
     *
     * @param {Record<string, unknown>} object - Object to union.
     * @returns {Collection<unknown>} Unioned collection.
     */
    union(object: Record<string, unknown>): Collection<unknown>;

    /**
     * Returns unique items.
     *
     * @param {keyof Item | string | ((item: Item, key: CollectionKey) => unknown) | undefined} [key] - Key selector.
     * @returns {Collection<Item>} Unique items.
     */
    unique(
      key?: keyof Item | string | ((item: Item, key: CollectionKey) => unknown),
    ): Collection<Item>;

    /**
     * Conditional execution helper (inverse of `when`).
     *
     * @template U
     * @param {boolean} condition - Condition.
     * @param {(collection: this, condition: boolean) => U} callback - Callback when condition is false.
     * @param {(collection: this, condition: boolean) => U} [defaultCallback] - Callback when condition is true.
     * @returns {this | U} Either the collection or callback result.
     */
    unless<U>(
      condition: boolean,
      callback: (collection: this, condition: boolean) => U,
      defaultCallback?: (collection: this, condition: boolean) => U,
    ): this | U;

    /**
     * Executes a callback when the collection is empty.
     *
     * @template U
     * @param {(collection: this) => U} callback - Callback to execute.
     * @param {(collection: this) => U} [defaultCallback] - Callback when not empty.
     * @returns {this | U} Either the collection or callback result.
     */
    unlessEmpty<U>(
      callback: (collection: this) => U,
      defaultCallback?: (collection: this) => U,
    ): this | U;

    /**
     * Executes a callback when the collection is not empty.
     *
     * @template U
     * @param {(collection: this) => U} callback - Callback to execute.
     * @param {(collection: this) => U} [defaultCallback] - Callback when empty.
     * @returns {this | U} Either the collection or callback result.
     */
    unlessNotEmpty<U>(
      callback: (collection: this) => U,
      defaultCallback?: (collection: this) => U,
    ): this | U;

    /**
     * Unwraps a collection into an array.
     *
     * @template U
     * @param {Collection<U> | readonly U[]} value - Value to unwrap.
     * @returns {U[]} Unwrapped array.
     */
    unwrap<U>(value: Collection<U> | readonly U[]): U[];

    /**
     * Resets keys to consecutive integers.
     *
     * @returns {Collection<Item>} Values collection.
     */
    values(): Collection<Item>;

    /**
     * Conditional execution helper.
     *
     * @template U
     * @param {boolean} condition - Condition.
     * @param {(collection: this, condition: boolean) => U} callback - Callback when condition is true.
     * @param {(collection: this, condition: boolean) => U} [defaultCallback] - Callback when condition is false.
     * @returns {this | U} Either the collection or callback result.
     */
    when<U>(
      condition: boolean,
      callback: (collection: this, condition: boolean) => U,
      defaultCallback?: (collection: this, condition: boolean) => U,
    ): this | U;

    /**
     * Executes a callback when the collection is empty.
     *
     * @template U
     * @param {(collection: this) => U} callback - Callback to execute.
     * @param {(collection: this) => U} [defaultCallback] - Callback when not empty.
     * @returns {this | U} Either the collection or callback result.
     */
    whenEmpty<U>(
      callback: (collection: this) => U,
      defaultCallback?: (collection: this) => U,
    ): this | U;

    /**
     * Executes a callback when the collection is not empty.
     *
     * @template U
     * @param {(collection: this) => U} callback - Callback to execute.
     * @param {(collection: this) => U} [defaultCallback] - Callback when empty.
     * @returns {this | U} Either the collection or callback result.
     */
    whenNotEmpty<U>(
      callback: (collection: this) => U,
      defaultCallback?: (collection: this) => U,
    ): this | U;

    /**
     * Filters by key/operator/value.
     *
     * Note: The runtime supports multiple overload shapes; we model the common ones.
     *
     * @param {keyof Item | string} key - Property name (supports dot-notation in runtime).
     * @param {unknown} operatorOrValue - Operator or value.
     * @param {unknown} [value] - Comparison value.
     * @returns {Collection<Item>} Filtered collection.
     */
    where(
      key: keyof Item | string,
      operatorOrValue: unknown,
      value?: unknown,
    ): Collection<Item>;

    /**
     * Filters by a range.
     *
     * @param {keyof Item | string} key - Property name.
     * @param {readonly [unknown, unknown]} values - Range tuple.
     * @returns {Collection<Item>} Filtered collection.
     */
    whereBetween(
      key: keyof Item | string,
      values: readonly [unknown, unknown],
    ): Collection<Item>;

    /**
     * Filters by values in a set.
     *
     * @param {keyof Item | string} key - Property name.
     * @param {readonly unknown[]} values - Allowed values.
     * @returns {Collection<Item>} Filtered collection.
     */
    whereIn(
      key: keyof Item | string,
      values: readonly unknown[],
    ): Collection<Item>;

    /**
     * Filters by instance of.
     *
     * @param {keyof Item | string} key - Property name.
     * @param {new (...args: readonly unknown[]) => unknown} ClassName - Class constructor.
     * @returns {Collection<Item>} Filtered collection.
     */
    whereInstanceOf(
      key: keyof Item | string,
      ClassName: new (...args: readonly unknown[]) => unknown,
    ): Collection<Item>;

    /**
     * Filters by not in range.
     *
     * @param {keyof Item | string} key - Property name.
     * @param {readonly [unknown, unknown]} values - Range tuple.
     * @returns {Collection<Item>} Filtered collection.
     */
    whereNotBetween(
      key: keyof Item | string,
      values: readonly [unknown, unknown],
    ): Collection<Item>;

    /**
     * Filters by values not in a set.
     *
     * @param {keyof Item | string} key - Property name.
     * @param {readonly unknown[]} values - Disallowed values.
     * @returns {Collection<Item>} Filtered collection.
     */
    whereNotIn(
      key: keyof Item | string,
      values: readonly unknown[],
    ): Collection<Item>;

    /**
     * Filters where the key is not null.
     *
     * @param {keyof Item | string} key - Property name.
     * @returns {Collection<Item>} Filtered collection.
     */
    whereNotNull(key: keyof Item | string): Collection<Item>;

    /**
     * Filters where the key is null.
     *
     * @param {keyof Item | string} key - Property name.
     * @returns {Collection<Item>} Filtered collection.
     */
    whereNull(key: keyof Item | string): Collection<Item>;

    /**
     * Wraps a value into a collection.
     *
     * @template U
     * @param {U | readonly U[] | Collection<U>} value - Value to wrap.
     * @returns {Collection<U>} Wrapped collection.
     */
    wrap<U>(value: U | readonly U[] | Collection<U>): Collection<U>;

    /**
     * Zips with another array.
     *
     * @template U
     * @param {readonly U[]} array - Array to zip.
     * @returns {Collection<readonly [Item, U]>} Zipped collection.
     */
    zip<U>(array: readonly U[]): Collection<readonly [Item, U]>;

    /**
     * Macro indexer.
     *
     * `collect.js` allows registering custom methods. Using `unknown` keeps it type-safe while not blocking extension.
     */
    [macroName: string]: unknown;

    /**
     * Returns an iterator over items.
     *
     * @returns {IterableIterator<Item>} Iterator.
     */
    [Symbol.iterator](): IterableIterator<Item>;
  }

  /**
   * Creates a collection instance.
   *
   * @template T
   * @param {unknown} [collection] - Initial collection.
   * @returns {Collection<T>} Collection.
   */
  export function collect<T>(collection?: unknown): Collection<T>;

  /**
   * Default export for `collect.js`.
   *
   * @template T
   * @param {unknown} [collection] - Initial collection.
   * @returns {Collection<T>} Collection.
   */
  export default function collect<T>(collection?: unknown): Collection<T>;
}
