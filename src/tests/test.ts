import { BaseCollection } from '../collections/base-collection';
import {
  NotificationServiceEnum,
  NotificationTypeEnum,
} from '../interfaces/notification.interface';
import { Notification } from './entities/notification.entity';
import { NotificationReadVisitor } from './visitors/notification-read-visitor';

const notifications: Notification[] = [];
const notifications2: Notification[] = [];

for (let i = 1; i <= 10; i++) {
  const n = new Notification();
  n.id = `${i}`;
  n.userId = `user${i}`;
  n.authorId = i % 2 === 0 ? `author${i}` : null;
  n.postId = i % 3 === 0 ? `post${i}` : null;

  if (i % 3 === 1) {
    n.type = NotificationTypeEnum.MESSAGE;
  } else if (i % 3 === 2) {
    n.type = NotificationTypeEnum.REMIND;
  } else {
    n.type = NotificationTypeEnum.HOT;
  }

  n.service = NotificationServiceEnum.PATH;
  n.image = null;
  n.text = `Текст уведомления номер ${i}`;
  n.isRead = false;
  n.link = `http://example.com/notification/${i}`;

  if (i != 10) {
    notifications.push(n);
  } else {
    console.log(n.id);
    n.subscribeEntityEvents((event) => {
      console.log(
        `Специальное событие сущности: ${event.event}`,
        event.payload,
      );
    });
    n.subscribePropertyEvents((event) => {
      console.log(
        `Специальное событие при изменение атрибута сущности: ${event.event}`,
        event.payload,
      );
    });
    notifications2.push(n);
  }
}

// Создаем коллекцию уведомлений с начальными элементами
const notificationsCollection = new BaseCollection<Notification>(notifications);

notificationsCollection.add(notifications2[0]);

// Массив для хранения эмитированных событий
const emittedEvents: Array<{ type: string; payload?: any }> = [];

// Подписываемся на события коллекции
const subscription = notificationsCollection.subscribe((event) => {
  console.log(`Событие коллекции: ${event.type}`, event.payload);
  emittedEvents.push(event);
});

// Выводим исходное состояние уведомлений
console.log('Исходное состояние уведомлений:');
notificationsCollection.getItems().forEach((n) => {
  console.log(`Notification (user: ${n.userId}) - isRead: ${n.isRead}`);
});

// Применяем Visitor, который, например, меняет isRead на true
const readVisitor = new NotificationReadVisitor();
notificationsCollection.accept(readVisitor);

// Выводим итоговое состояние уведомлений после применения Visitor
console.log('Состояние уведомлений после применения NotificationReadVisitor:');
notificationsCollection.getItems().forEach((n) => {
  console.log(`Notification (user: ${n.userId}) - isRead: ${n.isRead}`);
});

// Удаление элемента
// notificationsCollection.delete

// Проверяем, что события эмитились
if (emittedEvents.length > 0) {
  console.log(`Эмитированные события: ${emittedEvents.length}`);
  // console.dir(emittedEvents, { depth: null });
} else {
  console.error('События не были эмитированы!');
}

// Отписываемся от событий
subscription.unsubscribe();
