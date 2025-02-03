import { IVisitor } from '../../visitors/visitor.contract';
import { Notification } from '../entities/notification.entity';

/**
 * Пример реализации Visitor для уведомлений.
 * Данный посетитель помечает уведомление как прочитанное, устанавливая свойство isRead в true.
 */
export class NotificationReadVisitor implements IVisitor<Notification> {
  visit(item: Notification): void {
    // Если в Notification уже реализована логика через метод setAttribute,
    // можно использовать его для установки значения с эмитом событий.
    // Например:
    // item.setAttribute('isRead', true);

    // В данном примере просто напрямую устанавливаем свойство:
    item.isRead = true;
  }
}
