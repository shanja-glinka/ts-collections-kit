import { IBaseEntity } from './base.entity.interface';

/**
 * Contract for entities that track creation/update metadata.
 */
export interface IAuditedEntity extends IBaseEntity {
  /** Creation timestamp. */
  createdAt: Date;
  /** Update timestamp. */
  updatedAt: Date;
  /** Creator identifier. */
  createdBy: string;
  /** Updater identifier. */
  updatedBy: string;
}

/**
 * Contract for entities that support soft deletion.
 */
export interface ISoftDeletableEntity extends IBaseEntity {
  /** Soft-delete timestamp (null when active). */
  deletedAt: Date | null;
  /** Actor that performed the soft delete (null when active). */
  deletedBy: string | null;
}

/**
 * Convenience interface for entities that combine audit + soft-delete metadata.
 */
export interface IAuditedSoftDeletableEntity
  extends IAuditedEntity,
    ISoftDeletableEntity {}
