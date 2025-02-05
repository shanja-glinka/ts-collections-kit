import { BaseCollection } from '../collections/base-collection';
import { Notification } from './entities/notification.entity';
import { NotificationReadVisitor } from './visitors/notification-read-visitor';

// Создаем два массива уведомлений
const notifications: Notification[] = [];
const notifications2: Notification[] = [];

// Формируем 10 уведомлений
for (let i = 1; i <= 10; i++) {
  const n = new Notification();
  n.id = `${i}`;
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

console.log(`
// ===================================================================
// 1. Тестирование базового функционала коллекции с опциями по умолчанию
// (опции не включены, поэтому снапшоты и транзакции не работают)
// ===================================================================
`);

console.log('\n=== Тестирование базовой коллекции (опции отключены) ===');
const notificationsCollection = new BaseCollection<Notification>(notifications);
// Добавляем 10-е уведомление в коллекцию
notificationsCollection.add(notifications2[0]);

// Массив для хранения эмитированных событий коллекции
const emittedEvents: Array<{ type: string; payload?: any }> = [];

// Подписываемся на события коллекции
const subscription = notificationsCollection.subscribe((event) => {
  if (event.type === 'updated') {
    // @ts-ignore
    console.log(`Событие коллекции: ${event.type}`, event.payload.change);
    emittedEvents.push(event);
  } else {
    console.log(`Событие коллекции: ${event.type}`, '{...}');
  }
});

// Выводим исходное состояние уведомлений
console.log('\nИсходное состояние уведомлений:');
notificationsCollection.getItems().forEach((n) => {
  console.log(`Notification (id: ${n.id}) - isRead: ${n.isRead}`);
});

// Применяем Visitor, который помечает уведомления как прочитанные (isRead = true)
const readVisitor = new NotificationReadVisitor();
notificationsCollection.accept(readVisitor);

console.log(
  '\nСостояние уведомлений после применения NotificationReadVisitor:',
);
notificationsCollection.getItems().forEach((n) => {
  console.log(`Notification (id: ${n.id}) - isRead: ${n.isRead}`);
});

console.log(`\nИзменим уведомление с id "5". Ждем эмиты.`);
notificationsCollection.getItems()[5].isRead = false;
notificationsCollection.getItems()[5].isRead = true;

console.log(`
// ===================================================================
// 2. Тестирование удаления уведомления
// ===================================================================
`);

console.log(`\nУдалим уведомление с id "5"`);
const itemToRemove = notificationsCollection
  .getItems()
  .find((n) => n.id === '5');
if (itemToRemove) {
  notificationsCollection.remove(itemToRemove);
  console.log(
    `-> Количество уведомлений после удаления: ${notificationsCollection.count()}`,
  );
  console.log(`Уведомление с id ${itemToRemove.id} удалено.`);
  console.log(`-> Количество уведомлений: ${notificationsCollection.count()}`);
}

console.log(`
// ===================================================================
// 3. Тестирование commit/rollback (без транзакций, так как опции отключены)
// ===================================================================
`);

const firstItem = notificationsCollection.getItems()[0];
if (firstItem) {
  firstItem.isRead = false;
  console.log(`\nИзменили свойство isRead первого уведомления на false.`);
  console.log(
    `-> Количество непрочитанных уведомлений: ${notificationsCollection.reduce(
      (carry, n) => (carry ?? 0) + (n.isRead ? 0 : 1),
      0,
    )}`,
  );
}
console.log(`\nВыполним commit изменений коллекции`);
notificationsCollection.commit();
console.log('-> Коллекция зафиксирована (commit).');

const secondItem = notificationsCollection.getItems()[1];
if (secondItem) {
  secondItem.isRead = false;
  console.log(`\nИзменили свойство isRead второго уведомления на false.`);
  console.log(
    `-> Количество непрочитанных уведомлений: ${notificationsCollection.reduce(
      (carry, n) => (carry ?? 0) + (n.isRead ? 0 : 1),
      0,
    )}`,
  );
}
notificationsCollection.rollback();
console.log('\nОткат последнего изменения (rollback).');
console.log(
  `-> Количество непрочитанных уведомлений: ${notificationsCollection.reduce(
    (carry, n) => (carry ?? 0) + (n.isRead ? 0 : 1),
    0,
  )}`,
);

console.log(`
// ===================================================================
// 4. Тестирование операций трансформации (filter)
// ===================================================================
`);

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
  console.error('\n-> События не были эмитированы!');
}

// Отписываемся от событий
subscription.unsubscribe();

console.log(`
// ===================================================================
// 5. Тестирование коллекции с включенными опциями (снапшоты и транзакции)
// ===================================================================
`);
console.log(
  '\n=== Тестирование коллекции с включенными опциями (snapshots & transactions) ===',
);
const notificationsCollectionTx = new BaseCollection<Notification>(
  notifications,
  {
    enableSnapshots: true,
    enableTransactions: true,
  },
);

// Добавляем уведомление, чтобы проверить работу снапшотов
notificationsCollectionTx.add(notifications2[0]);
console.log(
  `Добавили уведомление, коллекция имеет ${notificationsCollectionTx.count()} элементов.`,
);

// Начнем транзакцию
try {
  const txToken = notificationsCollectionTx.beginTransaction();
  console.log(`Транзакция начата, токен: ${txToken}`);

  // Выполняем несколько изменений в рамках транзакции
  const txItem = notificationsCollectionTx.getItems()[0];
  if (txItem) {
    txItem.isRead = false;
    console.log(`В транзакции: изменили isRead первого уведомления на false.`);
  }
  notificationsCollectionTx.add(new Notification()); // Добавляем пустое уведомление для теста

  // Завершаем транзакцию
  const commitToken = notificationsCollectionTx.commitTransaction();
  console.log(`Транзакция завершена, токен: ${commitToken}`);
} catch (error) {
  console.error('Ошибка транзакции:', error);
}

// Тестируем rollback транзакции: начинаем новую транзакцию, вносим изменения и затем откатываем
try {
  const txToken = notificationsCollectionTx.beginTransaction();
  console.log(`Новая транзакция начата, токен: ${txToken}`);
  console.log(`\nУдалим уведомление с id "5"`);
  const itemToRemove = notificationsCollectionTx
    .getItems()
    .find((n) => n.id === '5');
  if (itemToRemove) {
    notificationsCollectionTx.remove(itemToRemove);
    console.log(
      `-> Количество уведомлений после удаления: ${notificationsCollectionTx.count()}`,
    );
    console.log(`Уведомление с id ${itemToRemove.id} удалено.`);
    console.log(
      `-> Количество уведомлений: ${notificationsCollectionTx.count()}`,
    );
  }

  const txItem2 = notificationsCollectionTx.getItems()[1];
  if (txItem2) {
    txItem2.isRead = true;
    console.log(`В транзакции: изменили isRead второго уведомления на true.`);
  }
  // Выполняем rollback
  notificationsCollectionTx.rollbackTransaction();
  console.log(`-> Записей после отката: ${notificationsCollectionTx.count()}`);
  console.log(
    `-> isRead второго уведомления: ${notificationsCollectionTx.getItems()[1].isRead}`,
  );
  console.log(`Откат транзакции выполнен.`);
} catch (error) {
  console.error('Ошибка транзакции:', error);
}

console.log(`
// ===================================================================
// 6. Тестирование операций трансформации (map) с включенными опциями
// ===================================================================
`);
const mappedCollection = notificationsCollectionTx.map((n) => {
  // Пример: создаем копию уведомления, в которой меняем флаг isRead
  const newN = { ...n, isRead: !n.isRead };
  return newN;
});
console.log(
  `\nРезультат map: исходное количество элементов: ${notificationsCollectionTx.count()}, новая коллекция: ${mappedCollection.count()}`,
);
