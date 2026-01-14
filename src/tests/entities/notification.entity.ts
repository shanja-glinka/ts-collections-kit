import { AuditedSoftDeletableEntity } from '../../entities/audited-entity';
import { INotification } from './notification.interface';

/**
 * Notification entity used in tests/examples.
 *
 * Extends `BaseEntity` to inherit lifecycle events and property-change tracking.
 */
export class Notification
  extends AuditedSoftDeletableEntity
  implements INotification
{
  /**
   * Notification text (HTML is allowed in this example).
   */
  text: string;

  /**
   * Read flag.
   */
  isRead: boolean;

  /**
   * Link for navigation. Can be `null` when absent.
   */
  link: string | null;
}
