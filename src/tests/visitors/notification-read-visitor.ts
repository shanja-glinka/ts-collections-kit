import { IVisitor } from '../../contracts/visitor.contract';
import { Notification } from '../entities/notification.entity';

/**
 * Example visitor implementation for notifications.
 *
 * This visitor marks a notification read by setting `isRead` to `true`.
 */
export class NotificationReadVisitor implements IVisitor<Notification> {
  /**
   * Marks a single notification read.
   *
   * @param {Notification} item - Notification entity to update.
   * @returns {void}
   */
  visit(item: Notification): void {
    item.isRead = true;
  }
}
