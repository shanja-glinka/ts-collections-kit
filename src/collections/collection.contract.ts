import { Collection as CollectJsCollection } from 'collect.js';
import { IVisitor } from '../contracts/visitor.contract';
import { CollectionEvent } from '../observers/collection-events';

/**
 * Интерфейс коллекции, расширяющий базовую коллекцию collect.js,
 * но исключающий методы map, filter и reduce, чтобы задать их наши версии.
 */
export interface ICollection<T>
  extends Omit<CollectJsCollection<T>, 'map' | 'filter' | 'reduce'> {
  map<U>(callback: (item: T, index: any) => U): ICollection<U>;
  // Для filter задаём перегрузки, как в collect.js:
  filter(fn: (item: T) => boolean): ICollection<T>;
  filter(fn: (item: T, key?: any) => boolean): ICollection<T>;
  reduce<U>(
    callback: (carry: U | null, item: T, key?: any) => U,
    initial: U,
  ): U;

  // Дополнительные методы:

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
  subscribe(callback: (event: CollectionEvent<T>) => void): void;
  /** Возвращает все элементы коллекции */
  getItems(): T[];

  // Дополнительные методы транзакционной модели:

  /**
   * Начинает транзакцию изменений коллекции.
   * Фиксирует начальное состояние и генерирует токен транзакции (timestamp в мс).
   *
   * @returns Токен транзакции.
   */
  beginTransaction(): number;

  /**
   * Завершает активную транзакцию, фиксируя итоговое состояние коллекции.
   *
   * @returns Токен завершенной транзакции.
   */
  commitTransaction(): number;

  /**
   * Откатывает активную транзакцию и восстанавливает состояние коллекции.
   */
  rollbackTransaction(): void;
}
