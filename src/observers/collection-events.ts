import { EntityEventType } from './observable.interface';

/**
 * Перечисление (типы) событий коллекции.
 * Возможные типы событий: добавление элемента, удаление элемента,
 * фиксация изменений (commit), откат изменений (rollback) и изменение сущности.
 */
export type CollectionEventType =
  | 'add'
  | 'remove'
  | 'commit'
  | 'rollback'
  | 'updated';

/**
 * Интерфейс события коллекции.
 *
 * @template T Тип элементов коллекции.
 *
 * Свойство type указывает на тип события, а payload может содержать:
 * - отдельный элемент T (например, при добавлении или удалении);
 * - массив элементов T (например, при commit);
 * - объект с элементом и информацией об изменении (при изменении сущности);
 * - объект с состоянием коллекции и токеном транзакции.
 */
export interface ICollectionEvent<T> {
  type: CollectionEventType;
  payload?: T | T[] | { item: T; change: any } | { state: T[]; token: any };
}

export type CollectionEvent<T> =
  | { type: 'add'; payload: T }
  | { type: 'remove'; payload: T }
  | { type: 'commit'; payload: { state: T[]; token: any } }
  | { type: 'rollback'; payload: T[] }
  | { type: 'updated'; payload: { item: T; change: any } }
  | { type: EntityEventType; payload: { item: T; change: any } };
