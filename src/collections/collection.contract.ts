import { Collection as CollectJsCollection } from 'collect.js';
import { ICollectionEvent } from '../observers/collection-events';
import { IVisitor } from '../visitors/visitor.contract';

/**
 * Интерфейс коллекции, расширяющий возможности collect.js и добавляющий
 * методы для паттернов Memento, Observer и Visitor.
 */
export interface ICollection<T> extends CollectJsCollection<T> {
  /** Добавляет элемент в коллекцию */
  add(item: T): void;
  /** Удаляет элемент из коллекции */
  remove(item: T): void;
  /** Фиксирует изменения коллекции (очищает историю снимков) */
  commit(): void;
  /** Откатывает последнее изменение коллекции */
  rollback(): void;
  /** Применяет Visitor ко всем элементам коллекции */
  accept(visitor: IVisitor<T>): void;
  /**
   * Подписывается на события коллекции.
   * Принимает callback, получающий объект события.
   */
  subscribe(callback: (event: ICollectionEvent<T>) => void): void;
  /** Возвращает все элементы коллекции */
  getItems(): T[];
}
