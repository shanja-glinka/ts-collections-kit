import { IBaseEntity } from '../../interfaces/base.entity.interface';

/**
 * Notification shape used in tests/examples.
 */
export interface INotification extends IBaseEntity {
  /** Notification text. */
  text: string;
  /** Read flag. */
  isRead: boolean;
  /** Optional link. */
  link: string | null;
}
