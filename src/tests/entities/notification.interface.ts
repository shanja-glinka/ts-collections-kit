import { IAuditedSoftDeletableEntity } from '../../interfaces/audited-entity.interface';

/**
 * Notification shape used in tests/examples.
 */
export interface INotification extends IAuditedSoftDeletableEntity {
  /** Notification text. */
  text: string;
  /** Read flag. */
  isRead: boolean;
  /** Optional link. */
  link: string | null;
}
