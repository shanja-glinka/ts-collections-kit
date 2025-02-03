/**
 * Перечисление событий жизненного цикла сущности.
 */
export enum EntityEvent {
  Creating = 'creating',
  Created = 'created',
  Updating = 'updating',
  Updated = 'updated',
  Deleting = 'deleting',
  Deleted = 'deleted',
  Saving = 'saving',
  Saved = 'saved',
  Restoring = 'restoring',
  Restored = 'restored',
}

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
