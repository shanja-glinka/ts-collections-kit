/**
 * Strategy for transforming a plain object into an entity instance with optional validation.
 *
 * Consumers can replace the default implementation to opt out of class-transformer/class-validator
 * or plug in custom pipelines.
 */
export interface IEntityTransformStrategy {
  /**
   * Transforms and validates a plain object.
   *
   * @template T
   * @param {new () => T} ctor - Target constructor.
   * @param {object} plain - Plain object.
   * @returns {Promise<T>} Transformed and validated instance.
   */
  plainToInstance<T extends object>(ctor: new () => T, plain: object): Promise<T>;
}
