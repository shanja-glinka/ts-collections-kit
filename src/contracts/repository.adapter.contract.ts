/**
 * Repository adapter contract.
 *
 * This interface abstracts persistence operations (e.g. TypeORM/Prisma/custom implementations)
 * so domain code can depend on a stable, strongly-typed contract.
 *
 * @template TEntity - Entity type.
 * @template TWhere - Query/filter type.
 * @template TCreateDto - Create DTO type.
 * @template TTransactionManager - Transaction manager type.
 */
export interface IRepositoryAdapter<
  TEntity,
  TWhere = unknown,
  TCreateDto = unknown,
  TTransactionManager = unknown,
> {
  /**
   * Finds a single entity by conditions.
   *
   * @param {TWhere} where - Search conditions.
   * @param {boolean | undefined} throwOnEmpty - If true, implementation should throw when nothing is found.
   * @param {TTransactionManager | undefined} transactionManager - Optional transaction manager.
   *
   * @returns {Promise<TEntity | null>} Found entity or `null`.
   */
  findOne(
    where: TWhere,
    throwOnEmpty?: boolean,
    transactionManager?: TTransactionManager,
  ): Promise<TEntity | null>;

  /**
   * Creates a new entity.
   *
   * @param {TCreateDto} createDto - Create DTO.
   * @param {TTransactionManager | undefined} transactionManager - Optional transaction manager.
   *
   * @returns {Promise<TEntity>} Created entity.
   */
  create(
    createDto: TCreateDto,
    transactionManager?: TTransactionManager,
  ): Promise<TEntity>;

  /**
   * Updates an existing entity.
   *
   * @param {string | TEntity} entity - Entity id or entity instance.
   * @param {Partial<TEntity>} updateDto - Partial update DTO.
   * @param {TTransactionManager | undefined} transactionManager - Optional transaction manager.
   *
   * @returns {Promise<TEntity>} Updated entity.
   */
  update(
    entity: string | TEntity,
    updateDto: Partial<TEntity>,
    transactionManager?: TTransactionManager,
  ): Promise<TEntity>;

  /**
   * Soft-deletes an entity by id (if supported).
   *
   * @param {string} id - Entity id.
   * @param {boolean | undefined} throwOnEmpty - If true, implementation should throw when nothing is found.
   * @param {TTransactionManager | undefined} transactionManager - Optional transaction manager.
   *
   * @returns {Promise<boolean>} Whether the entity was deleted.
   */
  delete(
    id: string,
    throwOnEmpty?: boolean,
    transactionManager?: TTransactionManager,
  ): Promise<boolean>;

  /**
   * Removes an entity (soft delete if supported by the implementation).
   *
   * @param {TEntity} entity - Entity instance.
   * @param {TTransactionManager | undefined} transactionManager - Optional transaction manager.
   *
   * @returns {Promise<boolean>} Whether the entity was removed.
   */
  remove(
    entity: TEntity,
    transactionManager?: TTransactionManager,
  ): Promise<boolean>;

  /**
   * Permanently deletes an entity by id.
   *
   * @param {string} id - Entity id.
   * @param {boolean | undefined} throwOnEmpty - If true, implementation should throw when nothing is found.
   * @param {TTransactionManager | undefined} transactionManager - Optional transaction manager.
   *
   * @returns {Promise<boolean>} Whether the entity was deleted.
   */
  permanentDelete(
    id: string,
    throwOnEmpty?: boolean,
    transactionManager?: TTransactionManager,
  ): Promise<boolean>;

  /**
   * Permanently removes an entity instance.
   *
   * @param {TEntity} entity - Entity instance.
   * @param {TTransactionManager | undefined} transactionManager - Optional transaction manager.
   *
   * @returns {Promise<boolean>} Whether the entity was removed.
   */
  permanentRemove(
    entity: TEntity,
    transactionManager?: TTransactionManager,
  ): Promise<boolean>;
}
