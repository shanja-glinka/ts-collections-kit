import { Observable, Subscription } from 'rxjs';
import { EntityEvent } from '../observers/collection-events';

export interface IObservable {
  /**
   * Подписывается на события жизненного цикла сущности.
   * @param handler Функция-обработчик, принимающая объект с именем события и дополнительными данными.
   * @returns Объект Subscription для управления подпиской.
   */
  subscribeEntityEvents(
    handler: (data: { event: EntityEvent; payload?: any }) => void,
  ): Subscription | any;

  /**
   * Возвращает Observable, который эмитит события изменения сущности.
   */
  getObservable(): Observable<any>;

  /**
   * Метод для вызова события создания сущности до сохранения.
   */
  creating(): void;

  /**
   * Метод для вызова события после успешного создания сущности.
   */
  created(): void;

  /**
   * Метод для вызова события обновления сущности до сохранения.
   */
  updating(): void;

  /**
   * Метод для вызова события после успешного обновления создания сущности.
   */
  updated(): void;

  /**
   * Метод для вызова события до удаления сущности.
   */
  deleting(): void;

  /**
   * Метод для вызова события после успешного удаления сущности.
   */
  deleted(): void;

  /**
   * Метод для вызова события до восстановления сущности.
   */
  restoring(): void;

  /**
   * Метод для вызова события после успешного восстановления сущности.
   */
  restored(): void;
}
