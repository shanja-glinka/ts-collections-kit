import collect, { Collection as CollectJsCollection } from 'collect.js';
import { Subject } from 'rxjs';
import { ICollectionEvent } from '../observers/collection-events';
import { deepClone } from '../utils/clone';
import { IVisitor } from '../visitors/visitor.contract';
import { ICollection } from './collection.contract';

/**
 * Класс BaseCollection расширяет функциональность коллекции из collect.js,
 * добавляя поддержку паттернов Memento, Observer и Visitor.
 *
 * Для наследования от collect.js мы используем конструктор, возвращаемый collect([]).
 */
const BaseCollectionConstructor = collect([]).constructor as {
  new <T>(items: T[]): CollectJsCollection<T>;
};

export class BaseCollection<T>
  extends BaseCollectionConstructor<T>
  implements ICollection<T>
{
  /**
   * История для паттерна Memento.
   */
  protected history: T[][] = [];
  /**
   * Subject для эмита событий коллекции (Observer).
   */
  protected eventsSubject = new Subject<ICollectionEvent<T>>();

  constructor(initialItems?: T[]) {
    super(initialItems || []); // Передаём начальные элементы в конструктор collect.js
  }

  /**
   * Возвращает все элементы коллекции.
   * В collect.js для этого используется метод all().
   */
  public getItems(): T[] {
    return this.all();
  }

  /**
   * Создаёт снимок текущего состояния коллекции.
   * Использует deepClone для создания глубокой копии.
   */
  protected snapshot(): void {
    this.history.push(deepClone(this.all()));
  }

  /**
   * Добавляет элемент в коллекцию.
   * Сохраняет снимок состояния, добавляет элемент и эмитирует событие 'add'.
   */
  public add(item: T): void {
    this.snapshot();
    this.push(item); // Метод push наследуется от collect.js
    this.eventsSubject.next({ type: 'add', payload: item });
  }

  /**
   * Удаляет элемент из коллекции.
   * Сохраняет снимок, затем заменяет внутреннее состояние коллекции отфильтрованным массивом.
   */
  public remove(item: T): void {
    this.snapshot();
    const filtered = this.all().filter((i) => i !== item);
    this.replace(filtered); // Метод replace() есть в collect.js для замены всех элементов
    this.eventsSubject.next({ type: 'remove', payload: item });
  }

  /**
   * Фиксирует изменения коллекции, очищая историю снимков.
   * Эмитирует событие 'commit'.
   */
  public commit(): void {
    this.history = [];
    this.eventsSubject.next({ type: 'commit', payload: this.all() });
  }

  /**
   * Откатывает последнее изменение, восстанавливая состояние коллекции из истории.
   * Эмитирует событие 'rollback'.
   */
  public rollback(): void {
    if (this.history.length) {
      const lastSnapshot = this.history.pop()!;
      this.replace(lastSnapshot);
      this.eventsSubject.next({ type: 'rollback', payload: this.all() });
    }
  }

  /**
   * Применяет Visitor ко всем элементам коллекции.
   */
  public accept(visitor: IVisitor<T>): void {
    this.all().forEach((item) => visitor.visit(item));
  }

  /**
   * Подписывается на события коллекции.
   */
  public subscribe(callback: (event: ICollectionEvent<T>) => void): void {
    this.eventsSubject.subscribe(callback);
  }
}
