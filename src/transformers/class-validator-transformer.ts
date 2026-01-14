import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { IEntityTransformStrategy } from '../contracts/entity-transform-strategy.contract';

/**
 * Default transformation strategy that relies on class-transformer + class-validator.
 */
export class ClassValidatorTransformStrategy
  implements IEntityTransformStrategy
{
  /**
   * Transforms and validates a plain object into an instance of the given constructor.
   *
   * @template T
   * @param {new () => T} ctor - Target constructor.
   * @param {object} plain - Plain object.
   * @returns {Promise<T>} Validated instance.
   *
   * @throws {Error} When validation fails.
   */
  public async plainToInstance<T extends object>(
    ctor: new () => T,
    plain: object,
  ): Promise<T> {
    const instance = plainToInstance(ctor, plain, {
      excludeExtraneousValues: true,
    });

    const errors = await validate(instance);
    if (errors.length > 0) {
      throw new Error(ClassValidatorTransformStrategy.formatValidationErrors(errors));
    }

    return instance;
  }

  /**
   * Converts validation errors into a readable message.
   *
   * @param {ValidationError[]} errors - Validation errors.
   * @returns {string} Human-readable error message.
   */
  private static formatValidationErrors(errors: ValidationError[]): string {
    const messages: string[] = [];

    for (const error of errors) {
      const constraints = error.constraints
        ? Object.values(error.constraints).join(', ')
        : 'Unknown validation error';
      messages.push(`Property: ${error.property} - ${constraints}`);
    }

    return messages.join('\n');
  }
}
