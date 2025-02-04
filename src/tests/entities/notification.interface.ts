import { IBaseEntity } from '../../interfaces/base.entity.interface';

export interface INotification extends IBaseEntity {
  text: string;
  isRead: boolean;
  link: string | null;
}
