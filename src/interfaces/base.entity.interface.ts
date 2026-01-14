/**
 * Minimal contract for any entity.
 *
 * Higher-level concerns (audit columns, soft delete) extend this interface to avoid forcing
 * every entity to carry the same fields.
 */
export interface IBaseEntity {
  /** Entity identifier. */
  id: string;
}
