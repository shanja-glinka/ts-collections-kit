import { BaseEntity } from '../../entities/base-entity';
import { INotification } from './notification.interface';

/**
 * Класс уведомления.
 *
 * Расширяет BaseEntity и наследует всю базовую логику валидации,
 * преобразования plain объектов в экземпляры сущностей, а также
 * функциональность эмита событий жизненного цикла.
 */
export class Notification extends BaseEntity implements INotification {
  /**
   * Текст уведомления в формате HTML.
   */
  text: string;

  /**
   * Флаг, указывающий, прочитано ли уведомление.
   */
  isRead: boolean;

  /**
   * Относительная ссылка для перехода по клику на уведомление. Может быть null, если ссылка отсутствует.
   */
  link: string | null;
}
