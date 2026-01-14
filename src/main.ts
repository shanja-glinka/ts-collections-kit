// Public API (root exports)
export { BaseCollection } from './collections/base-collection';
export type { ICollection } from './collections/collection.contract';

export { BaseEntity } from './entities/base-entity';
export {
  AuditedEntity,
  AuditedSoftDeletableEntity,
  SoftDeletableEntity,
} from './entities/audited-entity';

export type { IBaseEntity } from './interfaces/base.entity.interface';
export type {
  IAuditedEntity,
  IAuditedSoftDeletableEntity,
  ISoftDeletableEntity,
} from './interfaces/audited-entity.interface';
export type { ICollectionOptions } from './interfaces/collection-options.interface';

export { deepClone } from './utils/clone';

export { EntityEvent } from './observers/observable.interface';
export type {
  EntityEventType,
  IObservableEvent,
  IPropertyEvent,
  IPropertyEventPayload,
} from './observers/observable.interface';

export type {
  CollectionEvent,
  CollectionEventType,
  ICollectionEvent,
} from './observers/collection-events';

export type { IEventHandler } from './observers/observer-types';

export { IBaseTransformEntityContract } from './contracts/base-transform-entity.contract';
export type { IObservable } from './contracts/observable.contract';
export type { IRepositoryAdapter } from './contracts/repository.adapter.contract';
export type { IVisitor } from './contracts/visitor.contract';
export type { IEntityTransformStrategy } from './contracts/entity-transform-strategy.contract';
export { ClassValidatorTransformStrategy } from './transformers/class-validator-transformer';
