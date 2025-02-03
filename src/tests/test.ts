import { BaseCollection } from '../collections/base-collection';
import {
  NotificationServiceEnum,
  NotificationTypeEnum,
} from '../interfaces/notification.interface';
import { Notification } from './entities/notification.entity';
import { NotificationReadVisitor } from './visitors/notification-read-visitor';

// Создаем два массива уведомлений
const notifications: Notification[] = [];
const notifications2: Notification[] = [];

// Формируем 10 уведомлений
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

  // Для первых 9 уведомлений добавляем в массив notifications
  if (i !== 10) {
    notifications.push(n);
  } else {
    // Для 10-го уведомления подписываемся на специальные события и добавляем в notifications2
    console.log(`Notification id: ${n.id}`);
    n.subscribeEntityEvents((event) => {
      console.log(
        `----Специальное событие сущности: ${event.event}`,
        event.payload,
      );
    });
    n.subscribePropertyEvents((event) => {
      console.log(
        `--------Специальное событие при изменении атрибута: ${event.event}`,
        event.payload,
      );
    });
    notifications2.push(n);
  }
}

// Создаем коллекцию уведомлений с начальными элементами (9 уведомлений)
const notificationsCollection = new BaseCollection<Notification>(notifications);

// Добавляем 10-е уведомление в коллекцию
notificationsCollection.add(notifications2[0]);

// Массив для хранения эмитированных событий коллекции
const emittedEvents: Array<{ type: string; payload?: any }> = [];

// Подписываемся на события коллекции
const subscription = notificationsCollection.subscribe((event) => {
  const payload = event.payload as { item: Notification; change: any };
  // @ts-ignore
  console.log(
    `Событие коллекции: ${event.type}`,
    typeof payload?.change === 'undefined' ? '{...}' : payload.change,
  );
  emittedEvents.push(event);
});

// Выводим исходное состояние уведомлений
console.log('Исходное состояние уведомлений:');
notificationsCollection.getItems().forEach((n) => {
  console.log(`Notification (user: ${n.userId}) - isRead: ${n.isRead}`);
});

// Применяем Visitor, который помечает уведомления как прочитанные (isRead = true)
const readVisitor = new NotificationReadVisitor();
notificationsCollection.accept(readVisitor);

// Выводим состояние уведомлений после применения NotificationReadVisitor
console.log(
  '\nСостояние уведомлений после применения NotificationReadVisitor:',
);
notificationsCollection.getItems().forEach((n) => {
  console.log(`Notification (user: ${n.userId}) - isRead: ${n.isRead}`);
});

//
// ----- Тестирование удаления -----
//

// Удалим уведомление с id "5" (user5)
console.log(`\nУдалим уведомление с id "5" (user5)`);
const itemToRemove = notificationsCollection
  .getItems()
  .find((n) => n.id === '5');
if (itemToRemove) {
  notificationsCollection.remove(itemToRemove);
  console.log(`->Количество уведомлений: ${notificationsCollection.count()}`);
  console.log(`Уведомление с id ${itemToRemove.id} удалено.`);
  console.log(`->Количество уведомлений: ${notificationsCollection.count()}`);
}

//
// ----- Тестирование коммита -----
//
// Изменим какое-либо уведомление (например, поменяем isRead на false для первого элемента)
const firstItem = notificationsCollection.getItems()[0];
if (firstItem) {
  firstItem.isRead = false;
  console.log(`\nИзменили свойство isRead первого уведомления на false.`);
  console.log(
    `->Количество непрочитанных уведомлений: ${notificationsCollection.reduce(
      (carry, n) => {
        return (carry ?? 0) + (n.isRead ? 0 : 1);
      },
      0,
    )}`,
  );
}
// Выполним commit изменений коллекции
console.log(`\nВыполним commit изменений коллекции`);
notificationsCollection.commit();
console.log('->Коллекция зафиксирована (commit).');

//
// ----- Тестирование rollback -----
//
// Изменим еще одно уведомление
const secondItem = notificationsCollection.getItems()[1];
if (secondItem) {
  secondItem.isRead = false;
  console.log(`\nИзменили свойство isRead второго уведомления на false.`);
  console.log(
    `->Количество непрочитанных уведомлений: ${notificationsCollection.reduce(
      (carry, n) => {
        return (carry ?? 0) + (n.isRead ? 0 : 1);
      },
      0,
    )}`,
  );
}
// Откатим последнее изменение
notificationsCollection.rollback();
console.log('\nОткат последнего изменения (rollback).');
console.log(
  `->Количество непрочитанных уведомлений: ${notificationsCollection.reduce(
    (carry, n) => {
      return (carry ?? 0) + (n.isRead ? 0 : 1);
    },
    0,
  )}`,
);

//
// ----- Тестирование filter -----
//
// Отфильтруем уведомления, у которых isRead === true
const readNotifications = notificationsCollection.filter(
  (n) => n.isRead === true,
);
console.log(
  `\nКоличество уведомлений с isRead === true после всех операций: ${readNotifications.getItems().length}`,
);

// Проверяем, что события эмитились
if (emittedEvents.length > 0) {
  console.log(`\nЭмитированные события коллекции: ${emittedEvents.length}`);
} else {
  console.error('\n->События не были эмитированы!');
}

// Отписываемся от событий
subscription.unsubscribe();
