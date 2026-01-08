import { BaseEntity } from '../../entities/base-entity';

/**
 * Entity used in unit tests.
 *
 * This class is intentionally small: it exists only to validate event emission and proxy behavior
 * from `BaseEntity`.
 */
export class TestEntity extends BaseEntity {
  /** Arbitrary public field used to trigger tracked writes. */
  public foo?: string;

  /**
   * "Private-like" field (by naming convention).
   *
   * `BaseEntity` intentionally ignores properties starting with `_` for change tracking.
   */
  public _internal?: string;
}
