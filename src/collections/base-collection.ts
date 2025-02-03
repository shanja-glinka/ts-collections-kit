import collect, { Collection as CollectJsCollection } from 'collect.js';
import { Subject } from 'rxjs';
import { ICollectionEvent } from '../observers/collection-events';
import { deepClone } from '../utils/clone';
import { IVisitor } from '../visitors/visitor.contract';
import { ICollection } from './collection.contract';

/**
 * Базовая коллекция, реализующая паттерны Memento, Observer и Visitor.
 * Использует библиотеку collect.js для базовых операций над коллекцией.
 */
export class BaseCollection<T> implements ICollection<T> {
  /**
   * Внутренний экземпляр коллекции от collect.js.
   */
  protected underlying: CollectJsCollection<T>;

  /**
   * История для паттерна Memento.
   */
  protected history: T[][] = [];

  /**
   * Subject для эмита событий коллекции (Observer).
   */
  protected eventsSubject = new Subject<ICollectionEvent<T>>();

  constructor(initialItems?: T[]) {
    this.underlying = collect(initialItems || []);
  }

  /**
   * Возвращает все элементы коллекции.
   */
  public getItems(): T[] {
    return this.underlying.all();
  }

  /**
   * Создаёт снимок текущего состояния коллекции.
   * Использует deepClone для создания глубокой копии массива элементов.
   */
  protected snapshot(): void {
    this.history.push(deepClone(this.underlying.all()));
  }

  /**
   * Добавляет элемент в коллекцию.
   * Перед добавлением создаётся снимок состояния.
   * Эмитируется событие 'add'.
   *
   * @param item Добавляемый элемент.
   */
  public add(item: T): void {
    this.snapshot();
    this.underlying.push(item);
    this.eventsSubject.next({ type: 'add', payload: item });
  }

  /**
   * Удаляет элемент из коллекции.
   * Перед удалением создаётся снимок состояния.
   * Эмитируется событие 'remove'.
   *
   * @param item Элемент для удаления.
   */
  public remove(item: T): void {
    this.snapshot();
    // Фильтруем элементы, исключая удаляемый
    const filtered = this.underlying.all().filter((i) => i !== item);
    this.underlying = collect(filtered);
    this.eventsSubject.next({ type: 'remove', payload: item });
  }

  /**
   * Применяет функцию map ко всем элементам коллекции и возвращает новую коллекцию.
   *
   * @param callback Функция преобразования элемента.
   */
  public map<U>(callback: (item: T) => U): ICollection<U> {
    const mappedItems = this.underlying.map(callback).all();
    return new BaseCollection<U>(mappedItems);
  }

  /**
   * Применяет функцию filter к элементам коллекции и возвращает новую коллекцию.
   *
   * @param callback Функция фильтрации элемента.
   */
  public filter(callback: (item: T) => boolean): ICollection<T> {
    const filteredItems = this.underlying.filter(callback).all();
    return new BaseCollection<T>(filteredItems);
  }

  /**
   * Фиксирует изменения коллекции, очищая историю снимков.
   * Эмитируется событие 'commit'.
   */
  public commit(): void {
    this.history = [];
    this.eventsSubject.next({ type: 'commit', payload: this.getItems() });
  }

  /**
   * Откатывает последнее изменение, восстанавливая предыдущее состояние коллекции.
   * Эмитируется событие 'rollback'.
   */
  public rollback(): void {
    if (this.history.length) {
      const lastSnapshot = this.history.pop()!;
      this.underlying = collect(lastSnapshot);
      this.eventsSubject.next({ type: 'rollback', payload: this.getItems() });
    }
  }

  /**
   * Применяет Visitor ко всем элементам коллекции.
   *
   * @param visitor Экземпляр посетителя, реализующий IVisitor<T>.
   */
  public accept(visitor: IVisitor<T>): void {
    this.underlying.all().forEach((item) => visitor.visit(item));
  }

  /**
   * Подписывается на события коллекции.
   *
   * @param callback Функция-обработчик, получающая объект события.
   */
  public subscribe(callback: (event: ICollectionEvent<T>) => void): void {
    this.eventsSubject.subscribe(callback);
  }
}
