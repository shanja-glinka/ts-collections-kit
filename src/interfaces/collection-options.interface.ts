export interface ICollectionOptions {
  /** Enables/disables snapshot creation (Memento pattern). */
  enableSnapshots?: boolean;
  /** Enables/disables transactions (grouping multiple changes). */
  enableTransactions?: boolean;
  /** Maximum stored snapshots; old ones are discarded when limit is reached (only when snapshots enabled). */
  snapshotLimit?: number;
}
