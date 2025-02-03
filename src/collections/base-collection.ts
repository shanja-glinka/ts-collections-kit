import collect, { Collection as CollectJsCollection } from 'collect.js';
import { Subject } from 'rxjs';
import { ICollectionEvent } from '../observers/collection-events';
import { deepClone } from '../utils/clone';
import { IVisitor } from '../visitors/visitor.contract';
import { ICollection } from './collection.contract';

/**
 * Для наследования от collect.js мы получаем конструктор базовой коллекции.
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
  // Индексная сигнатура позволяет добавлять собственные свойства,
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
   * Возвращает все элементы коллекции (метод all() из collect.js).
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
   * Ключевое слово override обязательно, так как метод определён в базовом классе.
   */
  public override map<U>(
    callback: (item: T, key?: number) => U,
  ): BaseCollection<U> {
    const mapped = super.map(callback); // mapped имеет тип CollectJsCollection<U>
    return new BaseCollection<U>(mapped.all());
  }

  /**
   * Переопределяем метод filter, чтобы возвращать экземпляр BaseCollection<T>.
   */
  public override filter(
    callback: (item: T, key?: number) => boolean,
  ): BaseCollection<T> {
    const filtered = super.filter(callback);
    return new BaseCollection<T>(filtered.all());
  }

  /**
   * Переопределяем метод reduce, чтобы привести его к ожидаемой сигнатуре.
   */
  public override reduce<U>(
    callback: (carry: U, item: T, key?: number) => U,
    initial: U,
  ): U {
    // Предполагаем, что при передаче initial значение никогда не будет null.
    return super.reduce(callback, initial) as U;
  }
}
