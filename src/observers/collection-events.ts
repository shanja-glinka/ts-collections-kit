/**
 * Перечисление событий коллекции.
 */
export type CollectionEventType =
  | 'add'
  | 'remove'
  | 'commit'
  | 'rollback'
  | 'entity-change';

/**
 * Интерфейс события коллекции.
 */
export interface ICollectionEvent<T> {
  type: CollectionEventType;
  payload?: T | T[] | { item: T; change: any };
}
