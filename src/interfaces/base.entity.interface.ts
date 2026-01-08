/**
 * Base entity interface.
 */
export interface IBaseEntity {
  /** Entity identifier. */
  id: string;
  /** Creation timestamp. */
  createdAt: Date;
  /** Update timestamp. */
  updatedAt: Date;
  /** Creator identifier. */
  createdBy: string;
  /** Updater identifier. */
  updatedBy: string;
}
