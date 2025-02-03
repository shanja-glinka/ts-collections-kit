import { IVisitor } from '../../visitors/visitor.contract';
import { Notification } from '../entities/notification.entity';

/**
 * Пример реализации Visitor для уведомлений.
 * Данный посетитель помечает уведомление как прочитанное, устанавливая свойство isRead в true.
 */
export class NotificationReadVisitor implements IVisitor<Notification> {
  visit(item: Notification): void {
    item.isRead = true;
  }
}
