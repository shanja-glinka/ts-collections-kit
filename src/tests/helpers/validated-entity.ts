import { Expose } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { BaseEntity } from '../../entities/base-entity';

/**
 * Entity used to validate `BaseEntity.plainToInstance()` integration with:
 * - `class-transformer` (exposing fields and excluding unknown keys)
 * - `class-validator` (runtime validation)
 */
export class ValidatedEntity extends BaseEntity {
  /**
   * Public name field.
   *
   * This field is exposed for transformation and validated at runtime.
   */
  @Expose()
  @IsString()
  @Length(2, 20)
  public name!: string;
}
