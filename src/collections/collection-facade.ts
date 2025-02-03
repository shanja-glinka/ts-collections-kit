import { ICollectionEvent } from '../observers/collection-events';
import { IVisitor } from '../visitors/visitor.contract';
import { BaseCollection } from './base-collection';
import { ICollection } from './collection.contract';

/**
 * Фасад для работы с коллекциями.
 * Предоставляет единый интерфейс для операций над коллекциями, скрывая детали реализации.
 */
export class CollectionFacade<T> {
  private collection: ICollection<T>;

  constructor(initialItems?: T[]) {
    this.collection = new BaseCollection<T>(initialItems);
  }

  /** Добавляет элемент в коллекцию */
  public add(item: T): void {
    this.collection.add(item);
  }

  /** Удаляет элемент из коллекции */
  public remove(item: T): void {
    this.collection.remove(item);
  }

  /** Применяет map и возвращает новую коллекцию */
  public map<U>(callback: (item: T) => U): ICollection<U> {
    return this.collection.map(callback);
  }

  /** Применяет filter и возвращает новую коллекцию */
  public filter(callback: (item: T) => boolean): ICollection<T> {
    return this.collection.filter(callback);
  }

  /** Фиксирует изменения коллекции */
  public commit(): void {
    this.collection.commit();
  }

  /** Откатывает последнее изменение коллекции */
  public rollback(): void {
    this.collection.rollback();
  }

  /** Применяет Visitor ко всем элементам коллекции */
  public accept(visitor: IVisitor<T>): void {
    this.collection.accept(visitor);
  }

  /** Подписывается на события коллекции */
  public subscribe(callback: (event: ICollectionEvent<T>) => void): void {
    this.collection.subscribe(callback);
  }

  /** Возвращает текущие элементы коллекции */
  public getItems(): T[] {
    return this.collection.getItems();
  }
}
