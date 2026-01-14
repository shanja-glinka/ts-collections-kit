import { BaseEntity } from './base-entity';
import {
  IAuditedEntity,
  IAuditedSoftDeletableEntity,
  ISoftDeletableEntity,
} from '../interfaces/audited-entity.interface';

/**
 * Entity that carries audit metadata (created/updated timestamps and actors).
 */
export class AuditedEntity extends BaseEntity implements IAuditedEntity {
  public createdAt!: Date;
  public updatedAt!: Date;
  public createdBy!: string;
  public updatedBy!: string;
}

/**
 * Entity that supports soft deletion without forcing audit fields.
 */
export class SoftDeletableEntity
  extends BaseEntity
  implements ISoftDeletableEntity
{
  public deletedAt: Date | null = null;
  public deletedBy: string | null = null;
}

/**
 * Entity that combines audit metadata with soft-delete markers.
 */
export class AuditedSoftDeletableEntity
  extends AuditedEntity
  implements IAuditedSoftDeletableEntity
{
  public deletedAt: Date | null = null;
  public deletedBy: string | null = null;
}
