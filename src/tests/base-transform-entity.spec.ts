import { ValidatedEntity } from './helpers/validated-entity';

/**
 * Defines unit tests for `BaseEntity.plainToInstance()`.
 *
 * @returns {void}
 */
function defineBaseTransformEntityTests(): void {
  /**
   * Checks whether an object has an own property with the given key.
   *
   * @param {object} value - Object to check.
   * @param {string} key - Property key.
   * @returns {boolean} True when the key is an owned property.
   */
  function hasOwnKey(value: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  /**
   * Validates that `plainToInstance()` transforms and validates valid input.
   *
   * Given: plain object `{ name: 'Alice' }`.
   * Expect: instance of `ValidatedEntity` with `name` preserved and no validation errors.
   *
   * @returns {Promise<void>}
   */
  async function shouldTransformAndValidateValidInput(): Promise<void> {
    const entity = await ValidatedEntity.plainToInstance({ name: 'Alice' });

    expect(entity).toBeInstanceOf(ValidatedEntity);
    expect(entity.name).toBe('Alice');
  }

  /**
   * Creates an entity from invalid input to assert validation errors.
   *
   * Given: plain object `{ name: '' }` violating length constraint.
   * Expect: promise rejects with validation error mentioning `name`.
   *
   * @returns {Promise<ValidatedEntity>} Promise rejected with an error.
   */
  function createInvalidEntity(): Promise<ValidatedEntity> {
    return ValidatedEntity.plainToInstance({ name: '' });
  }

  /**
   * Validates that `plainToInstance()` rejects invalid input.
   *
   * Given: invalid plain object from `createInvalidEntity()`.
   * Expect: rejection with an error containing the field name.
   *
   * @returns {Promise<void>}
   */
  async function shouldRejectInvalidInput(): Promise<void> {
    await expect(createInvalidEntity()).rejects.toThrow('name');
  }

  /**
   * Validates that extra keys are excluded when transforming with `excludeExtraneousValues`.
   *
   * Given: object `{ name: 'Bob', extra: 'ignored' }`.
   * Expect: `name` preserved, `extra` absent on the entity.
   *
   * @returns {Promise<void>}
   */
  async function shouldExcludeExtraKeys(): Promise<void> {
    const entity = await ValidatedEntity.plainToInstance({
      name: 'Bob',
      extra: 'ignored',
    });

    expect(entity.name).toBe('Bob');

    // The `extra` key is not exposed and must not appear on the instance.
    expect(Reflect.get(entity, 'extra')).toBeUndefined();
    expect(hasOwnKey(entity, 'extra')).toBe(false);
  }

  it(
    'transforms and validates valid input',
    shouldTransformAndValidateValidInput,
  );
  it('rejects invalid input', shouldRejectInvalidInput);
  it('excludes extra keys', shouldExcludeExtraKeys);
}

describe('BaseEntity.plainToInstance', defineBaseTransformEntityTests);
