import collect, { Collection as CollectJsCollection } from 'collect.js';
import { Subject } from 'rxjs';
import { ICollectionEvent } from '../observers/collection-events';
import { deepClone } from '../utils/clone';
import { IVisitor } from '../visitors/visitor.contract';
import { ICollection } from './collection.contract';

/**
 * Получаем конструктор базовой коллекции из collect.js.
 */
const BaseCollectionConstructor = collect([]).constructor as {
  new <T>(items: T[]): CollectJsCollection<T>;
};

/**
 * Класс BaseCollection расширяет функциональность коллекции из collect.js,
 * добавляя поддержку паттернов Memento, Observer и Visitor.
 */
export class BaseCollection<T>
  extends BaseCollectionConstructor<T>
  implements ICollection<T>
{
  // Индексная сигнатура позволяет добавлять дополнительные свойства,
  // даже если базовый класс определяет их как функции.
  [key: string]: any;

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
   * Возвращает все элементы коллекции (аналог метода all() из collect.js).
   */
  public getItems(): T[] {
    return this.all();
  }

  /**
   * Создаёт снимок текущего состояния коллекции с помощью deepClone.
   */
  protected snapshot(): void {
    this.history.push(deepClone(this.all()));
  }

  /**
   * Добавляет элемент в коллекцию, сохраняя предыдущее состояние (Memento)
   * и эмитируя событие 'add'.
   */
  public add(item: T): void {
    this.snapshot();
    this.push(item); // push наследуется от collect.js
    this.eventsSubject.next({ type: 'add', payload: item });
  }

  /**
   * Удаляет элемент из коллекции, сохраняет снимок и эмитирует событие 'remove'.
   */
  public remove(item: T): void {
    this.snapshot();
    const filtered = this.all().filter((i) => i !== item);
    this.replace(filtered); // replace() из collect.js заменяет все элементы
    this.eventsSubject.next({ type: 'remove', payload: item });
  }

  /**
   * Фиксирует изменения коллекции, очищая историю снимков, и эмитирует событие 'commit'.
   */
  public commit(): void {
    this.history = [];
    this.eventsSubject.next({ type: 'commit', payload: this.all() });
  }

  /**
   * Откатывает последнее изменение коллекции, восстанавливая состояние из истории,
   * и эмитирует событие 'rollback'.
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

  /**
   * Переопределяем метод map, чтобы возвращать экземпляр BaseCollection<U>.
   * Сигнатура должна соответствовать базовой:
   *   map<T>(fn: (item: Item, index: any) => T): Collection<T>;
   */
  public override map<U>(
    callback: (item: T, index: any) => U,
  ): BaseCollection<U> {
    const mapped = super.map(callback) as CollectJsCollection<U>;
    return new BaseCollection<U>(mapped.all());
  }

  /**
   * Переопределяем метод filter, чтобы возвращать экземпляр BaseCollection<T>.
   * Объявляем перегрузки, как в collect.js:
   *   filter(fn: (item: Item) => boolean): Collection<Item>;
   *   filter(fn: (item: Item, key?: any) => boolean): Collection<Item>;
   */
  public override filter(fn: (item: T) => boolean): BaseCollection<T>;
  public override filter(
    fn: (item: T, key?: any) => boolean,
  ): BaseCollection<T>;
  public override filter(
    fn: (item: T, key?: any) => boolean,
  ): BaseCollection<T> {
    const filtered = super.filter(fn) as CollectJsCollection<T>;
    return new BaseCollection<T>(filtered.all());
  }

  /**
   * Переопределяем метод reduce, чтобы привести его к ожидаемой сигнатуре:
   *   reduce<T>(fn: (_carry: T | null, item: Item) => T, carry?: T): any;
   */
  public override reduce<U>(
    callback: (carry: U | null, item: T, key?: any) => U,
    initial: U,
  ): U {
    return super.reduce(callback, initial) as U;
  }
}
