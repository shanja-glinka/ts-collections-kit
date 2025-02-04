import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import 'reflect-metadata';
import { Observable, Subject } from 'rxjs';
import { IBaseTransformEntityContract } from '../contracts/base-transform-entity.contract';
import { IObservable } from '../contracts/observable.contract';
import { IBaseEntity } from '../interfaces/base.entity.interface';
import {
  EntityEvent,
  IObservableEvent,
  IPropertyEvent,
  IPropertyEventPayload,
} from '../observers/observable.interface';

/**
 * Базовый класс для сущностей.
 * валидацию и эмит событий жизненного цикла (Observer).
 * Также реализует интерфейс IObservable, позволяющий отслеживать изменения отдельных свойств.
 *
 * Теперь изменения свойств перехватываются через Proxy – не нужно вручную создавать аксессоры для каждого поля.
 */
export class BaseEntity
  implements IBaseEntity, IBaseTransformEntityContract, IObservable
{
  // Можно объявлять свойства как обычно.
  // Если требуется, чтобы они автоматически отслеживались, Proxy перехватит их запись.
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public createdBy!: string;
  public updatedBy!: string;

  /**
   * RxJS Subject для эмита событий жизненного цикла сущности.
   * Эмитируются события: creating, created, updating, updated, deleting, deleted, restoring, restored.
   */
  protected eventSubject = new Subject<IObservableEvent>();

  /**
   * Subject для отслеживания изменений отдельных свойств сущности.
   * События содержат: название свойства, старое и новое значение.
   */
  private propertyChangeSubject = new Subject<IPropertyEvent>();

  /**
   * Возвращает Observable, который эмитит события изменения отдельных свойств сущности.
   */
  public getEntityObservable(): Observable<{
    event: EntityEvent;
    payload?: any;
  }> {
    return this.eventSubject.asObservable();
  }

  /**
   * Возвращает Observable, который эмитит события изменения отдельных свойств сущности.
   */
  public getPropertyObservable(): Observable<IPropertyEvent> {
    return this.propertyChangeSubject.asObservable();
  }

  /**
   * Подписывается на события жизненного цикла сущности.
   *
   * @param handler Функция-обработчик, получающая объект события с его типом и дополнительными данными.
   *
   * @returns Объект Subscription для управления подпиской.
   */
  public subscribeEntityEvents(handler: (data: IObservableEvent) => void) {
    return this.eventSubject.subscribe(handler);
  }

  /**
   * Подписывается на события жизненного цикла .
   *
   * @param handler Функция-обработчик, получающая объект события с его типом и дополнительными данными.
   *
   * @returns Объект Subscription для управления подпиской.
   */
  public subscribePropertyEvents(handler: (data: IPropertyEvent) => void) {
    return this.propertyChangeSubject.subscribe(handler);
  }

  /**
   * Конструктор оборачивает экземпляр в Proxy для перехвата операций записи.
   *
   * При изменении свойства (если новое значение отличается от старого) происходит:
   * 1. Эмитируется событие "до обновления" (EntityEvent.Updating)
   * 2. Фактическое обновление свойства (Reflect.set)
   * 3. Эмитируется событие изменения свойства с флагом isProperty === true
   * 4. Эмитируется событие "после обновления" (EntityEvent.Updated)
   */
  constructor(...args: any[]) {
    return new Proxy(this, {
      set: (target, property, value, receiver) => {
        // Не обрабатываем специальные свойства и символы.
        if (typeof property === 'string' && property[0] !== '_') {
          // Извлекаем старое значение (если оно уже есть)
          const oldValue = target[property as keyof this];
          // Если значение не меняется — ничего не делаем.
          if (oldValue !== value) {
            const properties = {
              property,
              oldValue,
              newValue: value,
            };
            // Эмитируем событие до обновления
            target.emitEntityEvent(EntityEvent.Updating, properties);
            // Производим обновление свойства.
            // Чтобы не попасть в рекурсию, используем Reflect.set напрямую.
            Reflect.set(target, property, value);
            // Эмитируем событие изменения конкретного свойства
            target.emitPropertyEvent(EntityEvent.Updated, properties);
            // Эмитируем событие после обновления
            target.emitEntityEvent(EntityEvent.Updated, properties);
          }
          return true;
        }
        // Если свойство начинается с "_" или не является строкой – просто обновляем.
        return Reflect.set(target, property, value, receiver);
      },
    });
  }

  /**
   * Преобразует plain объект в экземпляр класса и проводит валидацию.
   * Если валидация не проходит, выбрасывается ошибка с подробным описанием.
   *
   * @param plain Объект для преобразования.
   *
   * @returns Преобразованный и валидированный экземпляр класса.
   *
   * @throws Error, если возникли ошибки валидации.
   */
  static async plainToInstance<T extends BaseEntity>(
    this: new () => T,
    plain: object,
  ): Promise<T> {
    const instance = plainToInstance(this, plain, {
      excludeExtraneousValues: true,
    });

    const errors = await validate(instance);

    if (errors.length > 0) {
      const errorMessage = BaseEntity.formatValidationErrors(errors);
      throw new Error(errorMessage);
    }

    return instance;
  }

  /**
   * Форматирует ошибки валидации в читаемую строку.
   *
   * @param errors Массив ошибок валидации.
   *
   * @returns Строка с описанием ошибок.
   */
  private static formatValidationErrors(errors: ValidationError[]): string {
    return errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'Неизвестная ошибка валидации';
        return `Свойство: ${error.property} - ${constraints}`;
      })
      .join('\n');
  }

  /**
   * Эмитирует событие жизненного цикла сущности.
   *
   * @param event Тип события (например, creating, updated и т.д.).
   *
   * @param payload Дополнительные данные, связанные с событием.
   */
  protected emitEntityEvent(event: EntityEvent, payload?: any): void {
    this.eventSubject.next({ event, payload });
  }

  /**
   * Эмитирует событие жизненного цикла свойства.
   *
   * @param event Тип события (например, creating, updated и т.д.).
   *
   * @param payload Дополнительные данные, связанные с событием.
   */
  protected emitPropertyEvent(
    event: EntityEvent,
    payload: IPropertyEventPayload,
  ): void {
    this.propertyChangeSubject.next({ event, payload });
  }

  // Методы для явного вызова событий жизненного цикла

  /** Вызывает событие создания сущности до сохранения. */
  public creating(): void {
    this.emitEntityEvent(EntityEvent.Creating);
  }

  /** Вызывает событие после успешного создания сущности. */
  public created(): void {
    this.emitEntityEvent(EntityEvent.Created);
  }

  /** Вызывает событие обновления сущности до сохранения. */
  public updating(): void {
    this.emitEntityEvent(EntityEvent.Updating);
  }

  /** Вызывает событие после успешного обновления сущности. */
  public updated(): void {
    this.emitEntityEvent(EntityEvent.Updated);
  }

  /** Вызывает событие до удаления сущности. */
  public deleting(): void {
    this.emitEntityEvent(EntityEvent.Deleting);
  }

  /** Вызывает событие после успешного удаления сущности. */
  public deleted(): void {
    this.emitEntityEvent(EntityEvent.Deleted);
  }

  /** Вызывает событие до восстановления сущности. */
  public restoring(): void {
    this.emitEntityEvent(EntityEvent.Restoring);
  }

  /** Вызывает событие после успешного восстановления сущности. */
  public restored(): void {
    this.emitEntityEvent(EntityEvent.Restored);
  }
}
