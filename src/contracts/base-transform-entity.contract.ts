/**
 * Контракт для трансформации plain объектов в экземпляры сущностей.
 * Можно расширять данный контракт при необходимости.
 */
export abstract class IBaseTransformEntityContract {
  /**
   * Transforms a plain object to an instance of the current class and validates it.
   *
   * @param plain The plain object to transform.
   * @returns The transformed and validated instance.
   *
   * @throws Error if validation fails.
   */
  static plainToInstance<T>(this: new () => T, plain: object): Promise<T> {
    throw new Error('Method not implemented.');
  }
}
