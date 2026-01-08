import { performance } from 'node:perf_hooks';
import { BaseCollection } from '../src/collections/base-collection';
import { BaseEntity } from '../src/entities/base-entity';

/**
 * Performance test entity used to simulate observable domain items.
 */
class PerfEntity extends BaseEntity {
  /** Tracked numeric field. */
  public value: number = 0;
}

/**
 * Reads the benchmark item count from `PERF_ITEMS` or returns a default.
 *
 * @returns {number} Item count.
 */
function getItemCount(): number {
  const raw = process.env.PERF_ITEMS;
  const parsed = raw ? Number(raw) : 100_000;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 100_000;
  }

  return Math.floor(parsed);
}

/**
 * Reads the snapshot benchmark cap from `PERF_SNAPSHOT_ITEMS`.
 *
 * Snapshot benchmarks are intentionally capped to avoid OOM (snapshots deep-clone items on every mutation).
 *
 * @returns {number} Snapshot item cap.
 */
function getSnapshotItemLimit(): number {
  const raw = process.env.PERF_SNAPSHOT_ITEMS;
  const parsed = raw ? Number(raw) : 2_000;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 2_000;
  }

  return Math.min(Math.floor(parsed), 10_000);
}

/**
 * Creates an array of sequential numbers.
 *
 * @param {number} count - Number of items.
 * @returns {number[]} Number array.
 */
function createNumbers(count: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i += 1) {
    values.push(i);
  }
  return values;
}

/**
 * Creates a list of observable entities.
 *
 * @param {number} count - Number of items.
 * @returns {PerfEntity[]} Entity array.
 */
function createEntities(count: number): PerfEntity[] {
  const values: PerfEntity[] = [];
  for (let i = 0; i < count; i += 1) {
    const entity = new PerfEntity();
    entity.value = i;
    values.push(entity);
  }
  return values;
}

/**
 * Measures elapsed time for a synchronous workload.
 *
 * @param {string} name - Measurement name.
 * @param {() => void} run - Workload.
 * @returns {{ name: string; ms: number }} Result object.
 */
function measureSync(
  name: string,
  run: () => void,
): { name: string; ms: number } {
  const start = performance.now();
  run();
  const end = performance.now();
  return { name, ms: end - start };
}

/**
 * Formats a duration in milliseconds.
 *
 * @param {number} ms - Duration.
 * @returns {string} Formatted duration.
 */
function formatMs(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

/**
 * Runs collection operation benchmarks on a numeric dataset.
 *
 * @param {number} itemCount - Number of items.
 * @returns {Array<{ name: string; ms: number }>} Results.
 */
function benchNumberCollection(
  itemCount: number,
): Array<{ name: string; ms: number }> {
  const numbers = createNumbers(itemCount);
  const collection = new BaseCollection<number>(numbers);
  const results: Array<{ name: string; ms: number }> = [];

  /**
   * Doubles a number.
   *
   * @param {number} value - Input number.
   * @returns {number} Doubled value.
   */
  function double(value: number): number {
    return value * 2;
  }

  /**
   * Keeps even numbers.
   *
   * @param {number} value - Input number.
   * @returns {boolean} True for even numbers.
   */
  function isEven(value: number): boolean {
    return value % 2 === 0;
  }

  /**
   * Runs `map` on the number collection.
   *
   * @returns {void}
   */
  function runMap(): void {
    collection.map(double).all();
  }

  /**
   * Runs `filter` on the number collection.
   *
   * @returns {void}
   */
  function runFilter(): void {
    collection.filter(isEven).all();
  }

  /**
   * Runs `reduce` on the number collection.
   *
   * @returns {void}
   */
  function runReduce(): void {
    /**
     * Adds a number to the accumulator.
     *
     * @param {number | null} carry - Accumulator.
     * @param {number} item - Current number.
     * @returns {number} New accumulator.
     */
    function sum(carry: number | null, item: number): number {
      return (carry ?? 0) + item;
    }

    collection.reduce(sum, 0);
  }

  results.push(measureSync('numbers.map(double)', runMap));
  results.push(measureSync('numbers.filter(isEven)', runFilter));
  results.push(measureSync('numbers.reduce(sum)', runReduce));

  return results;
}

/**
 * Runs benchmarks for snapshots and transactions on observable entities.
 *
 * @param {number} itemCount - Number of items.
 * @returns {Array<{ name: string; ms: number }>} Results.
 */
function benchEntitySnapshotsAndTransactions(
  itemCount: number,
): Array<{ name: string; ms: number }> {
  const snapshotLimit = getSnapshotItemLimit();
  const snapshotCount = Math.min(itemCount, snapshotLimit);
  const transactionCount = Math.min(itemCount, 50_000);

  const snapshotEntities = createEntities(snapshotCount);
  const transactionEntities = createEntities(transactionCount);
  const results: Array<{ name: string; ms: number }> = [];

  /**
   * Measures adding entities with snapshots enabled.
   *
   * @returns {void}
   */
  function runAddWithSnapshots(): void {
    const collection = new BaseCollection<PerfEntity>([], {
      enableSnapshots: true,
    });

    for (const entity of snapshotEntities) {
      collection.add(entity);
    }

    // Prevent dead-code elimination in JS engines.
    if (collection.count() !== snapshotCount) {
      throw new Error('Unexpected collection size.');
    }
  }

  /**
   * Measures adding entities inside a transaction and committing.
   *
   * @returns {void}
   */
  function runTransactionAddCommit(): void {
    const collection = new BaseCollection<PerfEntity>([], {
      enableSnapshots: true,
      enableTransactions: true,
    });

    collection.beginTransaction();

    for (const entity of transactionEntities) {
      collection.add(entity);
    }

    collection.commitTransaction();

    if (collection.count() !== transactionCount) {
      throw new Error('Unexpected collection size.');
    }
  }

  results.push(
    measureSync(
      `entities.add with snapshots (n=${snapshotCount})`,
      runAddWithSnapshots,
    ),
  );
  results.push(
    measureSync(
      `entities.transaction add/commit (n=${transactionCount})`,
      runTransactionAddCommit,
    ),
  );

  return results;
}

/**
 * Entrypoint for the performance runner.
 *
 * @returns {void}
 */
function main(): void {
  const itemCount = getItemCount();
  const snapshotCap = getSnapshotItemLimit();

  // Warm-up run to reduce first-run overhead.
  benchNumberCollection(Math.min(itemCount, 10_000));

  const results = [
    ...benchNumberCollection(itemCount),
    ...benchEntitySnapshotsAndTransactions(Math.min(itemCount, 50_000)),
  ];

  process.stdout.write(`PERF_ITEMS=${itemCount}\n`);
  process.stdout.write(`PERF_SNAPSHOT_ITEMS cap=${snapshotCap}\n`);
  for (const result of results) {
    process.stdout.write(`${result.name}: ${formatMs(result.ms)}\n`);
  }
}

main();
