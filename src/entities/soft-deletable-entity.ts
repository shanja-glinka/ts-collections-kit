import { ISoftDeletableEntity } from '../interfaces/soft-deletable.interface';

/**
 * Базовый класс для сущностей с поддержкой мягкого удаления.
 */
export class SoftDeletableEntity implements ISoftDeletableEntity {
  id!: string;
  deletedBy!: string | null;
  deletedAt?: Date;
}
