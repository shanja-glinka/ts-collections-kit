# TS Collections Library

Библиотека TS Collections предоставляет расширенные возможности для работы с коллекциями сущностей в стиле Laravel. Реализованы паттерны Memento, Observer и Visitor, позволяющие сохранять и откатывать изменения, отслеживать события жизненного цикла и применять операции ко всем элементам коллекции.

---

## Архитектура

### Сущности

- **BaseEntity**  
  Реализует преобразование plain-объектов в экземпляры с помощью _class-transformer_ и валидацию с использованием _class-validator_.  
  Содержит встроенные механизмы эмита событий жизненного цикла (создание, обновление, удаление, восстановление) посредством RxJS Subject.  
  Отслеживание изменений отдельных свойств осуществляется через Proxy, который перехватывает операции записи и эмитирует события до и после обновления свойства.  
  Интерфейс IObservable позволяет получать поток изменений отдельных свойств через методы `getEntityObservable()` и `getPropertyObservable()`.

### Коллекции

- **BaseCollection**  
  Расширяет функциональность библиотеки [collect.js](https://github.com/ecrmnn/collect.js) путем наследования от конструктора коллекции. Все стандартные методы (map, filter, reduce, all и пр.) доступны и переопределены таким образом, чтобы возвращать экземпляры BaseCollection с дополнительной функциональностью.  
  Дополнительные возможности включают:  
  - **Memento:** сохранение снимков состояния коллекции (метод `snapshot`), фиксация изменений через `commit` и откат через `rollback`.  
  - **Observer:** эмит событий коллекции посредством RxJS Subject. События, такие как `add`, `remove`, `commit`, `rollback` и `entity-change` (при изменении сущности), доступны для подписки через метод `subscribe`.  
  - **Visitor:** применение заданного посетителя ко всем элементам коллекции посредством метода `accept`.  
  - Подписка на события наблюдаемых сущностей происходит автоматически при добавлении элемента в коллекцию, если сущность реализует IObservable.

### Применение Visitor

Паттерн Visitor позволяет пройтись по каждому элементу коллекции и выполнить заданное действие. В реализации, например, класс _NotificationReadVisitor_ изменяет значение свойства `isRead` на `true` для каждого уведомления. Для корректного эмита событий изменения следует использовать механизм, вызывающий метод `setAttribute` (либо использовать аксессоры, реализующие вызов `setAttribute`).

## Инструкция по использованию

### Установка

Установить зависимости через npm или другой менеджер пакетов:

```bash
npm install
```

Основные зависимости включают:
- TypeScript
- collect.js
- rxjs
- lodash
- class-transformer
- class-validator

### Сборка

Сборка выполняется с помощью команд:

- Для сборки CommonJS:
  ```bash
  npm run build:cjs
  ```

- Для сборки ES-модулей:
  ```bash
  npm run build:esm
  ```

- Полная сборка (очистка `dist`, сборка CJS, переименование, сборка ESM):
  ```bash
  npm run build
  ```

### Тестирование

Для запуска тестового примера используется команда:

```bash
npm run test
```

Эта команда выполняет сборку и затем запускает тестовый сценарий, расположенный в `src/tests/test.ts`.

### Пример использования

Ниже приведен пример тестового сценария, демонстрирующий создание коллекции уведомлений, подписку на события, применение Visitor, а также тестирование операций удаления, commit и rollback.

```ts
import { BaseCollection } from '../collections/base-collection';
import {
  NotificationServiceEnum,
  NotificationTypeEnum,
} from '../interfaces/notification.interface';
import { Notification } from './entities/notification.entity';
import { NotificationReadVisitor } from './visitors/notification-read-visitor';

// Создаются два массива уведомлений.
const notifications: Notification[] = [];
const notifications2: Notification[] = [];

// Формирование 10 уведомлений.
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

  // Для первых 9 уведомлений добавляются в массив notifications,
  // а 10-е уведомление подписывается на специальные события и добавляется в notifications2.
  if (i !== 10) {
    notifications.push(n);
  } else {
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

// Создается коллекция уведомлений с начальными элементами (9 уведомлений).
const notificationsCollection = new BaseCollection<Notification>(notifications);

// Добавляется 10-е уведомление в коллекцию.
notificationsCollection.add(notifications2[0]);

// Массив для хранения эмитированных событий коллекции.
const emittedEvents: Array<{ type: string; payload?: any }> = [];

// Подписка на события коллекции.
const subscription = notificationsCollection.subscribe((event) => {
  const payload = event.payload as { item: Notification; change: any };
  console.log(
    `Событие коллекции: ${event.type}`,
    typeof payload?.change === 'undefined' ? '{...}' : payload.change,
  );
  emittedEvents.push(event);
});

// Вывод исходного состояния уведомлений.
console.log('Исходное состояние уведомлений:');
notificationsCollection.getItems().forEach((n) => {
  console.log(`Notification (user: ${n.userId}) - isRead: ${n.isRead}`);
});

// Применение Visitor, который помечает уведомления как прочитанные (isRead = true).
const readVisitor = new NotificationReadVisitor();
notificationsCollection.accept(readVisitor);

// Вывод состояния уведомлений после применения NotificationReadVisitor.
console.log(
  '\nСостояние уведомлений после применения NotificationReadVisitor:',
);
notificationsCollection.getItems().forEach((n) => {
  console.log(`Notification (user: ${n.userId}) - isRead: ${n.isRead}`);
});

//
// ----- Тестирование удаления -----
//
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
// ----- Тестирование commit -----
//
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
console.log(`\nВыполним commit изменений коллекции`);
notificationsCollection.commit();
console.log('->Коллекция зафиксирована (commit).');

//
// ----- Тестирование rollback -----
//
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
const readNotifications = notificationsCollection.filter(
  (n) => n.isRead === true,
);
console.log(
  `\nКоличество уведомлений с isRead === true после всех операций: ${readNotifications.getItems().length}`,
);

if (emittedEvents.length > 0) {
  console.log(`\nЭмитированные события коллекции: ${emittedEvents.length}`);
} else {
  console.error('\n->События не были эмитированы!');
}

subscription.unsubscribe();
```

### Результат тестирования

```
Notification id: 10
Исходное состояние уведомлений:
Notification (user: user1) - isRead: false
Notification (user: user2) - isRead: false
Notification (user: user3) - isRead: false
Notification (user: user4) - isRead: false
Notification (user: user5) - isRead: false
Notification (user: user6) - isRead: false
Notification (user: user7) - isRead: false
Notification (user: user8) - isRead: false
Notification (user: user9) - isRead: false
Notification (user: user10) - isRead: false
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: false, newValue: true } }
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: false, newValue: true } }
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: false, newValue: true } }
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: false, newValue: true } }
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: false, newValue: true } }
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: false, newValue: true } }
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: false, newValue: true } }
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: false, newValue: true } }
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: false, newValue: true } }
----Специальное событие сущности: updating { property: 'isRead', oldValue: false, newValue: true }
--------Специальное событие при изменении атрибута: updated { property: 'isRead', oldValue: false, newValue: true }
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: false, newValue: true } }
----Специальное событие сущности: updated { property: 'isRead', oldValue: false, newValue: true }

Состояние уведомлений после применения NotificationReadVisitor:
Notification (user: user1) - isRead: true
Notification (user: user2) - isRead: true
Notification (user: user3) - isRead: true
Notification (user: user4) - isRead: true
Notification (user: user5) - isRead: true
Notification (user: user6) - isRead: true
Notification (user: user7) - isRead: true
Notification (user: user8) - isRead: true
Notification (user: user9) - isRead: true
Notification (user: user10) - isRead: true

Удалим уведомление с id "5" (user5)
Событие коллекции: remove { ... }
->Количество уведомлений: 9
Уведомление с id 5 удалено.
->Количество уведомлений: 9
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: true, newValue: false } }

Изменили свойство isRead первого уведомления на false.
->Количество непрочитанных уведомлений: 1

Выполним commit изменений коллекции
Событие коллекции: commit { ... }
->Коллекция зафиксирована (commit).
Событие коллекции: updated { event: 'updated', payload: { property: 'isRead', oldValue: true, newValue: false } }

Изменили свойство isRead второго уведомления на false.
->Количество непрочитанных уведомлений: 2
Событие коллекции: rollback { ... }

Откат последнего изменения (rollback).
->Количество непрочитанных уведомлений: 1

Количество уведомлений с isRead === true после всех операций: 8

Эмитированные события коллекции: 15
```
