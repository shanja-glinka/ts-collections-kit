# TS Collections Library

Библиотека TS Collections предоставляет расширенные возможности для работы с коллекциями сущностей в стиле Laravel. Реализованы паттерны Memento, Observer и Visitor, позволяющие сохранять и откатывать изменения, отслеживать события жизненного цикла и применять операции ко всем элементам коллекции.


## Архитектура

### Сущности

- **BaseEntity**  
  Реализует преобразование plain-объектов в экземпляры с помощью _class-transformer_ и валидацию с использованием _class-validator_.  
  Содержит встроенные механизмы эмита событий жизненного цикла (создание, обновление, удаление, восстановление) посредством RxJS Subject.  
  Отслеживание изменений отдельных свойств осуществляется через Proxy, который перехватывает операции записи и эмитирует события до и после обновления свойства.  
  Интерфейс IObservable позволяет получать поток изменений отдельных свойств через методы `getEntityObservable()` и `getPropertyObservable()`.

### Коллекции

#### Возможности
#### 1. Основные возможности класса BaseCollection

Класс `BaseCollection` расширяет стандартный функционал коллекций из collect.js следующими возможностями:

- **Memento (снапшоты состояния):**  
  При любом изменении коллекции (например, добавление или удаление элемента) создаётся снапшот текущего состояния. Снапшоты сохраняются в глобальной истории или, если изменения происходят в рамках транзакции, в локальной истории.

- **Observer (эмит событий):**  
  Коллекция использует `RxJS Subject` для эмита событий. События (например, `add`, `remove`, `commit`, `rollback`) можно подписывать через метод `subscribe()`. Также коллекция подписывается на изменения отдельных сущностей (если они реализуют интерфейс `IObservable`).

- **Visitor:**  
  Метод `accept(visitor: IVisitor<T>)` позволяет применять паттерн Посетитель ко всем элементам коллекции.

- **Транзакционная модель:**  
  Методы `beginTransaction()`, `commitTransaction()` и `rollbackTransaction()` позволяют группировать несколько операций в одну транзакцию. При начале транзакции фиксируется начальное состояние коллекции, и по завершении транзакции результат сохраняется с токеном состояния (меткой времени в мс).

- **Трансформационные операции:**  
  Методы `map` и `filter` переопределены для возврата экземпляров `BaseCollection` и обернуты в транзакцию для корректного формирования снапшотов и токенов состояния.

#### 2. Инструкция по работе с BaseCollection

##### 2.1. Создание коллекции

```ts
import { BaseCollection } from './path/to/BaseCollection';

const collection = new BaseCollection<number>([1, 2, 3]);
```

##### 2.2. Добавление и удаление элементов

- **Добавление элемента:**

  ```ts
  collection.add(4); // Создаст снапшот (если нет активной транзакции), добавит элемент и эмитит событие 'add'
  ```

- **Удаление элемента:**

  ```ts
  collection.remove(2); // Фиксирует состояние, удаляет элемент и эмитит событие 'remove'
  ```

##### 2.3. Использование снапшотов и транзакций

- **Обычное фиксация изменений:**

  ```ts
  // Фиксируем текущее состояние коллекции (очищаем историю снапшотов)
  collection.commit();
  ```

- **Откат последнего изменения:**

  ```ts
  // Откат к предыдущему состоянию (вне транзакции)
  collection.rollback();
  ```

- **Использование транзакции:**

  ```ts
  // Начало транзакции – фиксируется начальное состояние, генерируется токен транзакции.
  const txToken = collection.beginTransaction();
  
  // Выполняем несколько операций
  collection.add(5);
  collection.remove(1);
  
  // Завершаем транзакцию – итоговое состояние фиксируется, эмитируется событие commit с токеном.
  collection.commitTransaction();
  
  // Если необходимо откатить изменения в транзакции:
  // collection.rollbackTransaction();
  ```

##### 2.4. Применение трансформационных операций

- **Map:**

  ```ts
  const mappedCollection = collection.map((item) => item * 10);
  // Возвращается новый экземпляр BaseCollection с результатом map.
  ```

- **Filter:**

  ```ts
  const filteredCollection = collection.filter((item) => item > 20);
  // Возвращается новый экземпляр BaseCollection с отфильтрованными элементами.
  ```

##### 2.5. Подписка на события

```ts
const subscription = collection.subscribe((event) => {
  console.log(`Событие коллекции: ${event.type}`, event.payload);
});

// Не забудьте отписаться при завершении работы:
subscription.unsubscribe();
```

##### 2.6. Применение паттерна Visitor

```ts
import { IVisitor } from '../visitors/visitor.contract';

class PrintVisitor implements IVisitor<number> {
  visit(item: number): void {
    console.log('Элемент коллекции:', item);
  }
}

collection.accept(new PrintVisitor());
```


#### 3. Рекомендации по работе с collection.js

- **Инициализация коллекции:**  
  При создании экземпляра `BaseCollection` передавайте начальный массив элементов, если он есть. Коллекция автоматически обернет его в функциональность collect.js.

- **Использование методов трансформации:**  
  Методы `map` и `filter` возвращают новый экземпляр `BaseCollection`, поэтому при выполнении этих операций можно продолжать цепочку вызовов, сохраняя при этом расширенный функционал.

- **Снапшоты и транзакции:**  
  При группировке нескольких изменений (например, внутри метода `map`) используйте транзакционную модель для аккумулирования изменений и получения корректного токена состояния.

- **Подписка на события:**  
  Используйте метод `subscribe` для получения уведомлений о событиях коллекции. Это удобно для реализации реактивных интерфейсов и отладки.


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
Файл результата доступен: [output.txt](/src/tests/output.txt)
