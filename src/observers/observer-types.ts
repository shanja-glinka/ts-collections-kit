import { EntityEvent } from './collection-events';

/**
 * Интерфейс обработчика событий для сущностей.
 */
export interface IEventHandler<T = any> {
  /** Название события, например, 'creating', 'updated' и т.д. */
  eventName: EntityEvent;
  /** Callback-функция, которая вызывается при срабатывании события */
  callback: (entity: T, payload?: any) => void;
}
