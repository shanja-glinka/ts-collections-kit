export interface ICollectionOptions {
  /** Включает/выключает создание снапшотов состояния коллекции (паттерн Memento). */
  enableSnapshots?: boolean;
  /** Включает/выключает работу транзакций (группировку изменений). */
  enableTransactions?: boolean;
}
