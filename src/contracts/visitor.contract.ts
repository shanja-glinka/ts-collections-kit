/**
 * Интерфейс посетителя для реализации паттерна Visitor.
 * Позволяет выполнять операцию над каждым элементом коллекции.
 */
export interface IVisitor<T> {
  /**
   * Метод, который будет вызван для каждого элемента коллекции.
   * @param item Элемент коллекции, над которым выполняется операция.
   */
  visit(item: T): void;
}
