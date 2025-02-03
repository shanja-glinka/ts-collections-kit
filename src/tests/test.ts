import { BaseCollection } from '../collections/base-collection';
import {
  NotificationServiceEnum,
  NotificationTypeEnum,
} from '../interfaces/notification.interface';
import { Notification } from './entities/notification.entity';
import { NotificationReadVisitor } from './visitors/notification-read-visitor';

const notifications: Notification[] = [];

for (let i = 1; i <= 10; i++) {
  const n = new Notification();
  n.userId = `user${i}`;
  n.authorId = i % 2 === 0 ? `author${i}` : null;
  n.postId = i % 3 === 0 ? `post${i}` : null;

  // Пример распределения типов уведомлений: message, remind, hot.
  if (i % 3 === 1) {
    n.type = NotificationTypeEnum.MESSAGE;
  } else if (i % 3 === 2) {
    n.type = NotificationTypeEnum.REMIND;
  } else {
    n.type = NotificationTypeEnum.HOT;
  }

  // Для простоты сервис всегда "path"
  n.service = NotificationServiceEnum.PATH;
  n.image = null; // Допустим, изображения отсутствуют
  n.text = `Текст уведомления номер ${i}`;
  n.isRead = false;
  n.link = `http://example.com/notification/${i}`;

  notifications.push(n);
}

// Создаем коллекцию уведомлений, используя наш BaseCollection
const notificationsCollection = new BaseCollection<Notification>(notifications);

// Подписываемся на события коллекции
notificationsCollection.subscribe((event) => {
  console.log(`Событие коллекции: ${event.type}`, event.payload);
});

// Выводим исходное состояние уведомлений
console.log('Исходное состояние уведомлений:');
notificationsCollection.getItems().forEach((n) => {
  console.log(`Notification (user: ${n.userId}) - isRead: ${n.isRead}`);
});

// Создаем экземпляр посетителя, который помечает уведомления как прочитанные
const readVisitor = new NotificationReadVisitor();

// Применяем Visitor ко всем уведомлениям в коллекции
notificationsCollection.accept(readVisitor);

// Выводим итоговое состояние уведомлений после применения Visitor
console.log('Состояние уведомлений после применения NotificationReadVisitor:');
notificationsCollection.getItems().forEach((n) => {
  console.log(`Notification (user: ${n.userId}) - isRead: ${n.isRead}`);
});

export default true;
