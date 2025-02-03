import { IRepositoryAdapter } from '../contracts/repository.adapter.contract';
import { ICollectionEvent } from '../observers/collection-events';
import { IVisitor } from '../visitors/visitor.contract';
import { BaseCollection } from './base-collection';
import { ICollection } from './collection.contract';

/**
 * Фасад для работы с коллекциями.
 * Предоставляет единый интерфейс для операций над коллекцией,
 * скрывая детали реализации, включая работу с collect.js, Memento, Observer, Visitor.
 * Если на бекенде используется typeorm, через репозиторный адаптер можно синхронизировать изменения.
 */
export class CollectionFacade<T extends { id?: string }> {
  private collection: ICollection<T>;
  private repositoryAdapter?: IRepositoryAdapter<T>;

  /**
   * @param initialItems Начальные элементы коллекции.
   * @param repositoryAdapter (Опционально) адаптер для работы с репозиторием (например, typeorm).
   */
  constructor(initialItems?: T[], repositoryAdapter?: IRepositoryAdapter<T>) {
    this.collection = new BaseCollection<T>(initialItems);
    this.repositoryAdapter = repositoryAdapter;
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

  /**
   * Если репозиторный адаптер предоставлен, синхронизирует все элементы коллекции с базой данных.
   * Пример: сохраняет каждый элемент коллекции через репозиторий.
   */
  public async sync(): Promise<void> {
    if (!this.repositoryAdapter) {
      throw new Error('Repository adapter is not provided');
    }
    const items = this.collection.getItems() as T[];
    for (const item of items) {
      const hasId = typeof item?.id !== 'undefined';
      const record = !hasId
        ? await this.repositoryAdapter.create(item)
        : await this.repositoryAdapter.update(item.id as string, item);
    }
  }
}
