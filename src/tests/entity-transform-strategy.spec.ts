import { BaseEntity } from '../entities/base-entity';
import { IEntityTransformStrategy } from '../contracts/entity-transform-strategy.contract';
import { ClassValidatorTransformStrategy } from '../transformers/class-validator-transformer';
import { ValidatedEntity } from './helpers/validated-entity';

/**
 * Custom strategy used to verify DI hooks for transformation.
 */
class PassthroughTransformStrategy implements IEntityTransformStrategy {
  async plainToInstance<T extends object>(
    ctor: new () => T,
    plain: object,
  ): Promise<T> {
    const instance = new ctor();
    Object.assign(instance as object, plain);
    return instance;
  }
}

describe('Entity transform strategy injection', () => {
  afterEach(() => {
    BaseEntity.setTransformStrategy(new ClassValidatorTransformStrategy());
  });

  it('uses a custom strategy instead of the default validator-based one', async () => {
    BaseEntity.setTransformStrategy(new PassthroughTransformStrategy());

    const entity = await ValidatedEntity.plainToInstance({
      name: '', // would fail validation with the default strategy
    });

    expect(entity).toBeInstanceOf(ValidatedEntity);
    expect(entity.name).toBe('');
  });
});
