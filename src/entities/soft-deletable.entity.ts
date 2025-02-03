import { ISoftDeletableEntity } from '../contracts/soft-deletable.interface';

/**
 * Базовый класс для сущностей с поддержкой мягкого удаления.
 */
export class SoftDeletableEntity implements ISoftDeletableEntity {
  id!: string;
  deletedBy!: string | null;
  deletedAt?: Date;
}
