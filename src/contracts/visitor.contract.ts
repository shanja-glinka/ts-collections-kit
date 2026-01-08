/**
 * Visitor contract (Visitor pattern).
 *
 * @template T - Visited item type.
 */
export interface IVisitor<T> {
  /**
   * Executes an operation for a single item.
   *
   * @param {T} item - Collection item to visit.
   * @returns {void}
   */
  visit(item: T): void;
}
