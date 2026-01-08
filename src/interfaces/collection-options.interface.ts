export interface ICollectionOptions {
  /** Enables/disables snapshot creation (Memento pattern). */
  enableSnapshots?: boolean;
  /** Enables/disables transactions (grouping multiple changes). */
  enableTransactions?: boolean;
}
