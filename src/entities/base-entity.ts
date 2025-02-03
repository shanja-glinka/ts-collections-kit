// src/entities/BaseEntity.ts

import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import 'reflect-metadata';
import { Observable, Subject } from 'rxjs';
import { IBaseTransformEntityContract } from '../contracts/base-transform-entity.contract';
import { IObservable } from '../contracts/observable.contract';
import { IBaseEntity } from '../interfaces/base.entity.interface';
import { EntityEvent } from '../observers/collection-events';
import { SoftDeletableEntity } from './soft-deletable-entity';

/**
 * Базовый класс для сущностей.
 * Расширяет SoftDeletableEntity, обеспечивает преобразование plain объектов в экземпляры,
 * валидацию и эмит событий жизненного цикла (Observer).
 * Также реализует интерфейс IObservable, позволяющий отслеживать изменения отдельных свойств.
 */
export class BaseEntity
  extends SoftDeletableEntity
  implements IBaseEntity, IBaseTransformEntityContract, IObservable
{
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;

  /**
   * RxJS Subject для эмита событий жизненного цикла сущности.
   * Через него эмитируются события, такие как: creating, created, updating, updated, deleting, deleted, restoring, restored.
   */
  protected eventSubject = new Subject<{ event: EntityEvent; payload?: any }>();

  /**
   * Subject для отслеживания изменений отдельных свойств сущности.
   * События из него содержат информацию о том, какое свойство изменилось, его старое и новое значение.
   */
  private propertyChangeSubject = new Subject<{
    property: string;
    oldValue: any;
    newValue: any;
  }>();

  /**
   * Возвращает Observable, который эмитит события изменения отдельных свойств сущности.
   * Клиенты могут подписаться на него для получения детальной информации об изменениях.
   */
  public getObservable(): Observable<{
    property: string;
    oldValue: any;
    newValue: any;
  }> {
    return this.propertyChangeSubject.asObservable();
  }

  /**
   * Метод для централизованного изменения значения свойства.
   * Если новое значение отличается от старого, эмитируются события:
   *  - Перед обновлением: EntityEvent.Updating (с информацией о свойстве, старом и новом значениях)
   *  - Событие изменения отдельного свойства через propertyChangeSubject
   *  - После обновления: EntityEvent.Updated (с информацией о свойстве и его новом значении)
   *
   * @param key Имя свойства, которое изменяется.
   * @param value Новое значение свойства.
   */
  protected setAttribute<K extends keyof this>(key: K, value: this[K]): void {
    const oldValue = this[key];

    if (oldValue !== value) {
      // Эмитируем событие обновления до фактического изменения значения
      this.emitEntityEvent(EntityEvent.Updating, {
        key,
        oldValue,
        newValue: value,
      });

      // Отправляем событие о конкретном изменении свойства
      this.propertyChangeSubject.next({
        property: key as string,
        oldValue,
        newValue: value,
      });

      // Обновляем значение свойства
      this[key] = value;

      // Эмитируем событие после обновления значения
      this.emitEntityEvent(EntityEvent.Updated, { key, value });
    }
  }

  /**
   * Преобразует plain объект в экземпляр класса и проводит валидацию.
   * Если валидация не проходит, выбрасывается ошибка с подробным описанием.
   *
   * @param plain Объект для преобразования.
   * @returns Преобразованный и валидированный экземпляр класса.
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
   * Подписывается на события жизненного цикла сущности.
   *
   * @param handler Функция-обработчик, получающая объект события с его типом и дополнительными данными.
   * @returns Объект Subscription для управления подпиской.
   */
  public subscribeEntityEvents(
    handler: (data: { event: EntityEvent; payload?: any }) => void,
  ) {
    return this.eventSubject.subscribe(handler);
  }

  /**
   * Эмитирует событие жизненного цикла сущности.
   *
   * @param event Тип события (например, creating, updated и т.д.).
   * @param payload Дополнительные данные, связанные с событием.
   */
  protected emitEntityEvent(event: EntityEvent, payload?: any): void {
    this.eventSubject.next({ event, payload });
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
