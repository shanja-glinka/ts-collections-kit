import collect, { Collection as CollectJsCollection } from 'collect.js';
import { Subject, Subscription } from 'rxjs';
import { IObservable } from '../contracts/observable.contract';
import { ICollectionOptions } from '../interfaces/collection-options.interface';
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
 * добавляя поддержку паттернов Memento, Observer, Visitor и транзакционное
 * сохранение состояния с генерацией токена (timestamp в мс). Функциональность
 * создания снапшотов и транзакций может быть включена или отключена через опции.
 */
export class BaseCollection<T>
  extends BaseCollectionConstructor<T>
  implements ICollection<T>
{
  [key: string]: any;

  /** Опции коллекции (снапшоты и транзакции). По умолчанию отключены. */
  protected options: ICollectionOptions;

  /**
   * Глобальная история снимков коллекции, где каждый снимок имеет свой токен состояния.
   */
  protected history: { token: number; state: T[] }[] = [];

  /**
   * Флаг, показывающий, что в данный момент выполняется транзакция.
   */
  protected transactionActive = false;
  /**
   * Токен текущей транзакции (timestamp в мс).
   */
  protected transactionToken: number | null = null;
  /**
   * Локальная история снимков внутри транзакции.
   */
  protected transactionHistory: T[][] = [];

  /**
   * Subject для эмита событий коллекции (Observer).
   */
  protected eventsSubject = new Subject<ICollectionEvent<T>>();
  /**
   * Здесь будем хранить подписки на события сущностей.
   */
  protected entitySubscriptions: Subscription[] = [];

  /**
   * Конструктор коллекции.
   * @param initialItems Начальные элементы коллекции.
   * @param options Опции для включения/выключения снапшотов и транзакций.
   */
  constructor(initialItems?: T[], options?: ICollectionOptions) {
    super(initialItems || []);
    // Устанавливаем опции по умолчанию: обе функциональности отключены.
    this.options = {
      enableSnapshots: false,
      enableTransactions: false,
      ...options,
    };

    // Подписываемся на события от наблюдаемых сущностей
    (initialItems || []).forEach((item) => {
      this.subscribeToItem(item);
    });
  }

  /**
   * Подписывается на события наблюдаемой сущности.
   * Если сущность реализует IObservable, подписывается на её события и сохраняет подписку.
   */
  private subscribeToItem(item: T): void {
    if (
      (item as any).getPropertyObservable &&
      typeof (item as any).getPropertyObservable === 'function'
    ) {
      const sub = (item as unknown as IObservable)
        .getPropertyObservable()
        .subscribe((eventData) => {
          // Если транзакция не активна и включены снапшоты, создаём снапшот.
          if (!this.transactionActive && this.options.enableSnapshots) {
            this.snapshot();
          }
          this.eventsSubject.next({
            type: eventData.event,
            payload: { item, change: eventData },
          });
        });
      const sub2 = (item as unknown as IObservable)
        .getEntityObservable()
        .subscribe((eventData) => {
          if (
            eventData.event === 'updating' &&
            !this.transactionActive &&
            this.options.enableSnapshots
          ) {
            this.snapshot();
          }
        });
      this.entitySubscriptions.push(sub);
      this.entitySubscriptions.push(sub2);
    }
  }

  /**
   * Возвращает все элементы коллекции.
   */
  public getItems(): T[] {
    return this.all();
  }

  /**
   * Создает снапшот текущего состояния коллекции.
   * Если транзакция активна, сохраняет изменения в transactionHistory,
   * иначе – в глобальной истории с токеном, равным текущему времени.
   */
  protected snapshot(): void {
    // Если функциональность снапшотов отключена – ничего не делаем.
    if (!this.options.enableSnapshots) {
      return;
    }
    const currentState = deepClone(this.all());
    if (this.transactionActive) {
      this.transactionHistory.push(currentState);
    } else {
      const token = Date.now();
      this.history.push({ token, state: currentState });
    }
  }

  /**
   * Очищает глобальную историю снапшотов.
   */
  protected resetSnapshot(): void {
    this.history = [];
  }

  /**
   * Начинает транзакцию изменений коллекции.
   * Фиксирует начальное состояние и генерирует токен (timestamp).
   *
   * @returns Токен транзакции.
   * @throws Error если транзакции отключены или уже активна.
   */
  public beginTransaction(): number {
    if (!this.options.enableTransactions) {
      throw new Error('Транзакции отключены в настройках коллекции.');
    }
    if (this.transactionActive) {
      throw new Error('Транзакция уже активна');
    }
    this.transactionActive = true;
    this.transactionToken = Date.now();
    // Фиксируем начальное состояние
    if (this.options.enableSnapshots) {
      this.transactionHistory = [deepClone(this.all())];
    }
    return this.transactionToken;
  }

  /**
   * Завершает транзакцию, фиксируя итоговое состояние коллекции вместе с токеном.
   * Эмитирует событие 'commit' с итоговым состоянием и токеном транзакции.
   *
   * @returns Токен завершенной транзакции.
   * @throws Error если транзакции отключены или не активна.
   */
  public commitTransaction(): number {
    if (!this.options.enableTransactions) {
      throw new Error('Транзакции отключены в настройках коллекции.');
    }
    if (!this.transactionActive) {
      throw new Error('Нет активной транзакции для фиксации');
    }
    const token = this.transactionToken!;
    const finalState = deepClone(this.all());
    if (this.options.enableSnapshots) {
      this.history.push({ token, state: finalState });
    }
    this.transactionActive = false;
    this.transactionToken = null;
    this.transactionHistory = [];
    this.eventsSubject.next({
      type: 'commit',
      payload: { state: this.all(), token },
    });
    return token;
  }

  /**
   * Откатывает коллекцию до состояния, зафиксированного в начале транзакции.
   * Эмитирует событие 'rollback' с восстановленным состоянием.
   *
   * @throws Error если транзакции отключены или не активна.
   */
  public rollbackTransaction(): void {
    if (!this.options.enableTransactions) {
      throw new Error('Транзакции отключены в настройках коллекции.');
    }
    if (!this.transactionActive) {
      throw new Error('Нет активной транзакции для отката');
    }
    // Восстанавливаем первоначальное состояние транзакции
    if (this.options.enableSnapshots && this.transactionHistory.length) {
      const initialState = this.transactionHistory[0];
      (this as any).items = initialState;
    }
    this.transactionActive = false;
    this.transactionToken = null;
    this.transactionHistory = [];
    this.eventsSubject.next({ type: 'rollback', payload: this.all() });
  }

  /**
   * Добавляет элемент в коллекцию.
   * Если транзакция не активна и включены снапшоты, фиксирует текущее состояние (Memento).
   * Эмитирует событие 'add' и подписывается на изменения сущности, если она наблюдаемая.
   *
   * @param item Элемент для добавления.
   */
  public add(item: T): void {
    if (!this.transactionActive && this.options.enableSnapshots) {
      this.snapshot();
    }
    this.push(item);
    this.eventsSubject.next({ type: 'add', payload: item });
    this.subscribeToItem(item);
  }

  /**
   * Удаляет элемент из коллекции.
   * Фиксирует состояние перед удалением (если транзакция не активна и включены снапшоты)
   * и эмитирует событие 'remove'.
   *
   * @param item Элемент для удаления.
   */
  public remove(item: T): void {
    if (!this.transactionActive && this.options.enableSnapshots) {
      this.snapshot();
    }
    const filtered = this.all().filter((i) => i !== item);
    (this as any).items = filtered;
    this.eventsSubject.next({ type: 'remove', payload: item });
  }

  /**
   * Фиксирует изменения коллекции вне транзакции, очищая историю снапшотов,
   * и эмитирует событие 'commit'.
   */
  public commit(): void {
    if (this.transactionActive) {
      this.commitTransaction();
    } else {
      this.resetSnapshot();
      (this as any).items = this.all();
      this.eventsSubject.next({ type: 'commit', payload: this.all() });
    }
  }

  /**
   * Откатывает последнее изменение коллекции (вне транзакции), восстанавливая состояние из истории,
   * и эмитирует событие 'rollback'.
   */
  public rollback(): void {
    if (this.history.length) {
      const lastSnapshot = this.history.pop()!;
      (this as any).items = lastSnapshot.state;
      this.eventsSubject.next({ type: 'rollback', payload: this.all() });
    }
  }

  /**
   * Применяет Visitor ко всем элементам коллекции.
   *
   * @param visitor Посетитель, который будет применен ко всем элементам.
   */
  public accept(visitor: IVisitor<T>): void {
    this.all().forEach((item) => visitor.visit(item));
  }

  /**
   * Подписывается на события коллекции.
   *
   * @param callback Функция, вызываемая при наступлении события.
   * @returns Subscription для управления подпиской.
   */
  public subscribe(
    callback: (event: ICollectionEvent<T>) => void,
  ): Subscription {
    return this.eventsSubject.subscribe(callback);
  }

  /**
   * Переопределенный метод map, чтобы возвращать экземпляр BaseCollection<U>.
   * Оборачивает операцию в транзакцию: фиксируем состояние до и после трансформации,
   * если транзакции включены.
   *
   * @param callback Функция трансформации.
   * @returns Новая коллекция с результатом map.
   */
  public override map<U>(
    callback: (item: T, index: any) => U,
  ): BaseCollection<U> {
    let token = 0;
    if (this.options.enableTransactions) {
      token = this.beginTransaction();
    }
    const mapped = super.map(callback) as CollectJsCollection<U>;
    const newCollection = new BaseCollection<U>(mapped.all(), this.options);
    if (this.options.enableTransactions) {
      this.commitTransaction();
      newCollection.history.push({ token, state: newCollection.all() });
    }
    return newCollection;
  }

  /**
   * Переопределенный метод filter, чтобы возвращать экземпляр BaseCollection<T>.
   * Фиксирует изменения через транзакцию, если транзакции включены.
   *
   * @param fn Функция фильтрации.
   * @returns Новая коллекция с отфильтрованными элементами.
   */
  public override filter(
    fn: (item: T, key?: any) => boolean,
  ): BaseCollection<T> {
    let token = 0;
    if (this.options.enableTransactions) {
      token = this.beginTransaction();
    }
    const filtered = super.filter(fn) as CollectJsCollection<T>;
    const newCollection = new BaseCollection<T>(filtered.all(), this.options);
    if (this.options.enableTransactions) {
      this.commitTransaction();
      newCollection.history.push({ token, state: newCollection.all() });
    }
    return newCollection;
  }

  /**
   * Переопределенный метод reduce, приводя его к ожидаемой сигнатуре.
   *
   * @param callback Функция редукции.
   * @param initial Начальное значение.
   * @returns Результат редукции.
   */
  public override reduce<U>(
    callback: (carry: U | null, item: T, key?: any) => U,
    initial: U,
  ): U {
    return super.reduce(callback, initial) as U;
  }
}
