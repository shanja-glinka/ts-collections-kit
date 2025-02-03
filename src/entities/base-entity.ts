import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import 'reflect-metadata';
import { Subject } from 'rxjs';
import { IBaseTransformEntityContract } from '../contracts/base-transform-entity.contract';
import { IBaseEntity } from '../contracts/base.entity.interface';
import { EntityEvent } from '../observers/collection-events';
import { SoftDeletableEntity } from './soft-deletable.entity';

/**
 * Базовый класс для сущностей.
 * Расширяет SoftDeletableEntity, обеспечивает преобразование plain объектов в экземпляры,
 * валидацию и эмит событий жизненного цикла (Observer).
 */
export class BaseEntity
  extends SoftDeletableEntity
  implements IBaseEntity, IBaseTransformEntityContract
{
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;

  /**
   * RxJS Subject для эмита событий жизненного цикла сущности.
   * Через него эмитируются события: creating, created, updating, updated, deleting, deleted, saving, saved, restoring, restored.
   */
  protected eventSubject = new Subject<{ event: EntityEvent; payload?: any }>();

  /**
   * Преобразует plain объект в экземпляр класса и проводит валидацию.
   * @param plain Объект для преобразования
   * @returns Экземпляр класса
   * @throws Error, если валидация не пройдена
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
   * @param errors Массив ошибок валидации
   * @returns Строка с описанием ошибок
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
   * @param handler Функция-обработчик, принимающая объект с именем события и дополнительными данными.
   * @returns Объект Subscription для управления подпиской.
   */
  public subscribeEntityEvents(
    handler: (data: { event: EntityEvent; payload?: any }) => void,
  ) {
    return this.eventSubject.subscribe(handler);
  }

  /**
   * Эмитирует событие жизненного цикла сущности.
   * @param event Имя события (например, creating, updated, и т.д.)
   * @param payload Дополнительные данные, передаваемые вместе с событием.
   */
  protected emitEntityEvent(event: EntityEvent, payload?: any): void {
    this.eventSubject.next({ event, payload });
  }

  /**
   * Пример метода для установки значения атрибута с вызовом событий обновления.
   * Этот метод можно использовать для централизованного контроля изменений свойств.
   * @param key Имя свойства
   * @param value Новое значение свойства
   */
  protected setAttribute<K extends keyof this>(key: K, value: this[K]): void {
    // Эмитируем событие обновления до изменения значения
    this.emitEntityEvent(EntityEvent.Updating, {
      key,
      oldValue: this[key],
      newValue: value,
    });
    // Изменяем значение свойства
    this[key] = value;
    // Эмитируем событие обновления после изменения
    this.emitEntityEvent(EntityEvent.Updated, { key, value });
  }

  /**
   * Метод для вызова события создания сущности до сохранения.
   */
  public creating(): void {
    this.emitEntityEvent(EntityEvent.Creating);
  }

  /**
   * Метод для вызова события после успешного создания сущности.
   */
  public created(): void {
    this.emitEntityEvent(EntityEvent.Created);
  }

  // Аналогичные методы можно добавить для событий удаления, сохранения, восстановления и т.д.
}
