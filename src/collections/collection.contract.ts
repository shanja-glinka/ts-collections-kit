import { ICollectionEvent } from '../observers/collection-events';
import { IVisitor } from '../visitors/visitor.contract';

/**
 * Интерфейс коллекции, поддерживающий базовые операции collect.js,
 * а также дополнительные методы для паттернов Memento, Observer и Visitor.
 */
export interface ICollection<T> {
  // Методы collect.js (например, all, map, filter, reduce, groupBy и пр.)
  all(): T[];
  map<U>(callback: (item: T) => U): ICollection<U>;
  filter(callback: (item: T) => boolean): ICollection<T>;
  reduce<U>(callback: (carry: U, item: T) => U, initial: U): U;
  groupBy(callback: (item: T) => string): any;
  // ... (другие методы collect.js, если необходимо)

  // Дополнительные методы нашей обёртки:
  /** Добавляет элемент в коллекцию с сохранением снимка (Memento) */
  add(item: T): void;
  /** Удаляет элемент из коллекции с сохранением снимка (Memento) */
  remove(item: T): void;
  /** Фиксирует изменения коллекции (очищает историю снимков) */
  commit(): void;
  /** Откатывает последнее изменение коллекции (восстанавливает предыдущее состояние) */
  rollback(): void;
  /** Применяет Visitor ко всем элементам коллекции */
  accept(visitor: IVisitor<T>): void;
  /**
   * Подписывается на события коллекции (Observer).
   * Принимает callback, который получает объект события.
   */
  subscribe(callback: (event: ICollectionEvent<T>) => void): void;
  /** Возвращает все элементы коллекции */
  getItems(): T[];
}
