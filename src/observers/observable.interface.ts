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

export interface IPropertyEventPayload {
  property: string;
  oldValue: any;
  newValue: any;
}

export interface IObservableEvent {
  event: EntityEvent;
  payload?: any;
}

export interface IPropertyEvent extends IObservableEvent {
  payload: IPropertyEventPayload;
}
