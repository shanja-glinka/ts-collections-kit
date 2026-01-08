/**
 * Contract-like base for transforming plain objects into entity instances.
 *
 * Note: TypeScript cannot truly enforce static methods through interfaces, so this class exists
 * primarily for documentation and a shared shape for implementations.
 */
export abstract class IBaseTransformEntityContract {
  /**
   * Transforms a plain object into an instance and validates it.
   *
   * @template T
   * @param {new () => T} this - Concrete constructor.
   * @param {object} plain - Plain object to transform.
   * @returns {Promise<T>} Validated instance.
   *
   * @throws {Error} When validation fails.
   */
  static plainToInstance<T>(this: new () => T, plain: object): Promise<T> {
    throw new Error('Method not implemented.');
  }
}
