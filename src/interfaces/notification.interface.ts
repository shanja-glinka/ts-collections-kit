import { IBaseEntity } from '../contracts/base.entity.interface';
export interface IFile extends IBaseEntity {
  /**
   * Relative path to the file.
   *
   * @type {string}
   */
  path: string;

  /**
   * Dominant color of the image, used as a placeholder background during lazy loading. Null if not applicable.
   *
   * @type {string | null}
   */
  colorHex: string | null;

  /**
   * Size of the file in bytes. Null if size is not available.
   *
   * @type {number | null}
   */
  sizeBytes: number | null;

  /**
   * Width of the file in pixels. Null if not applicable.
   *
   * @type {number | null}
   */
  widthPx: number | null;

  /**
   * Height of the file in pixels. Null if not applicable.
   *
   * @type {number | null}
   */
  heightPx: number | null;
}
export enum NotificationTypeEnum {
  MESSAGE = 'message',
  REMIND = 'remind',
  HOT = 'hot',
}
export enum NotificationServiceEnum {
  PATH = 'path',
}
export type IFileType = IFile;

export interface INotification extends IBaseEntity {
  userId: string;
  authorId: string | null;
  postId: string | null;
  type: NotificationTypeEnum;
  service: NotificationServiceEnum;
  image: IFileType | null;
  text: string;
  isRead: boolean;
  link: string | null;
}
