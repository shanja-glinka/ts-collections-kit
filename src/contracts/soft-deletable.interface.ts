/**
 * Интерфейс для сущностей с поддержкой мягкого удаления.
 */
export interface ISoftDeletableEntity {
  id: string;
  deletedBy: string | null;
  deletedAt?: Date;
}
