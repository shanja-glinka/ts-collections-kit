import { ICollectionEvent } from '../observers/collection-events';
import { IVisitor } from '../visitors/visitor.contract';

/**
 * Интерфейс для коллекций, поддерживающий базовые операции, паттерны Memento, Visitor и Observer.
 */
export interface ICollection<T> {
  /** Добавляет элемент в коллекцию */
  add(item: T): void;
  /** Удаляет элемент из коллекции */
  remove(item: T): void;
  /** Применяет функцию map к коллекции и возвращает новую коллекцию */
  map<U>(callback: (item: T) => U): ICollection<U>;
  /** Применяет функцию filter к коллекции и возвращает новую коллекцию */
  filter(callback: (item: T) => boolean): ICollection<T>;
  /** Фиксирует изменения коллекции, очищая историю снимков */
  commit(): void;
  /** Откатывает последнее изменение коллекции, восстанавливая предыдущее состояние */
  rollback(): void;
  /** Применяет Visitor ко всем элементам коллекции */
  accept(visitor: IVisitor<T>): void;
  /**
   * Подписывается на события коллекции.
   * @param callback Функция-обработчик, получающая объект события.
   */
  subscribe(callback: (event: ICollectionEvent<T>) => void): void;
  /** Возвращает все элементы коллекции */
  getItems(): T[];
}
