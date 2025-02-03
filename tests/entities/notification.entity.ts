import { INotification } from '../../interfaces/notification.interface';
import { BaseEntity } from '../../entities/base-entity';

/**
 * Класс уведомления.
 *
 * Расширяет BaseEntity и наследует всю базовую логику валидации,
 * преобразования plain объектов в экземпляры сущностей, а также
 * функциональность эмита событий жизненного цикла.
 */
export class Notification extends BaseEntity implements INotification {
  /**
   * ID пользователя, которому адресовано уведомление.
   */
  userId: string;

  /**
   * ID автора, инициировавшего уведомление. Может быть null, если инициатор отсутствует.
   */
  authorId: string | null;

  /**
   * ID поста, инициировавшего уведомление. Может быть null, если пост не связан.
   */
  postId: string | null;

  /**
   * Тип уведомления: "message", "remind" или "hot".
   */
  type: NotificationTypeEnum;

  /**
   * Тип сервиса уведомления. В данный момент всегда "path".
   */
  service: NotificationServiceEnum;

  /**
   * Изображение, ассоциированное с уведомлением. Может быть null, если изображение отсутствует.
   */
  image: IFileType | null;

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

  /**
   * Пример метода, демонстрирующего выполнение какой-либо логики.
   *
   * @returns Строку с сообщением.
   */
  public doSomething(): string {
    return 'it did!';
  }

  /**
   * Ещё один пример метода.
   *
   * @returns Строку с другим сообщением.
   */
  public doSomethingMore2(): string {
    return 'it did2!';
  }
}
