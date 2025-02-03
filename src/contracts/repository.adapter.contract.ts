/**
 * Интерфейс-адаптер для работы с репозиторием (например, typeorm).
 */
export interface IRepositoryAdapter<T> {
  /**
   * Находит одну запись по заданным условиям.
   *
   * @param {any} where - Условия для поиска.
   * @param {boolean} [throwOnEmpty] - Если true, выбрасывает исключение, если сущность не найдена.
   * @param {any} [transactionManager] - Опциональный менеджер транзакций.
   *
   * @returns {Promise<T | null>} - Найденная сущность или null.
   */
  findOne(
    where: any,
    throwOnEmpty?: boolean,
    transactionManager?: any,
  ): Promise<T | null>;

  /**
   * Создаёт новую запись.
   *
   * @param {any} createDto - Данные для создания записи.
   * @param {any} [transactionManager] - Опциональный менеджер транзакций.
   *
   * @returns {Promise<T>} - Созданная сущность.
   */
  create(createDto: any, transactionManager?: any): Promise<T>;

  /**
   * Обновляет существующую запись.
   *
   * @param {string|T} entity - Идентификатор записи или Сущность T.
   * @param {Partial<T>} updateDto - Данные для обновления.
   * @param {any} [transactionManager] - Опциональный менеджер транзакций.
   *
   * @returns {Promise<T>} - Обновлённая сущность.
   */
  update(
    entity: string | T,
    updateDto: Partial<T>,
    transactionManager?: any,
  ): Promise<T>;

  /**
   * Выполняет мягкое удаление записи.
   *
   * @param {string} id - Идентификатор сущности.
   * @param {boolean} [throwOnEmpty] - Выбрасывать ли исключение, если сущность не найдена.
   * @param {any} [transactionManager] - Опциональный менеджер транзакций.
   *
   * @returns {Promise<boolean>} - Удалена ли сущность.
   */
  delete(
    id: string,
    throwOnEmpty?: boolean,
    transactionManager?: any,
  ): Promise<boolean>;

  /**
   * Удаляет сущность (мягкое удаление, если поддерживается).
   *
   * @param {T} entity - Сущность для удаления.
   * @param {any} [transactionManager] - Опциональный менеджер транзакций.
   *
   * @returns {Promise<boolean>} - Удалена ли сущность.
   */
  remove(entity: T, transactionManager?: any): Promise<boolean>;

  /**
   * Полное удаление сущности (без возможности восстановления).
   *
   * @param {string} id - Идентификатор сущности.
   * @param {boolean} [throwOnEmpty] - Выбрасывать ли исключение, если сущность не найдена.
   * @param {any} [transactionManager] - Опциональный менеджер транзакций.
   *
   * @returns {Promise<boolean>} - Удалена ли сущность.
   */
  permanentDelete(
    id: string,
    throwOnEmpty?: boolean,
    transactionManager?: any,
  ): Promise<boolean>;

  /**
   * Полное удаление сущности (без восстановления).
   *
   * @param {T} entity - Сущность для удаления.
   * @param {any} [transactionManager] - Опциональный менеджер транзакций.
   *
   * @returns {Promise<boolean>} - Удалена ли сущность.
   */
  permanentRemove(entity: T, transactionManager?: any): Promise<boolean>;
}
