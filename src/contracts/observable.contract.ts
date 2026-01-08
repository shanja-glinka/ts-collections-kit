import { Observable, Subscription } from 'rxjs';
import {
  IObservableEvent,
  IPropertyEvent,
} from '../observers/observable.interface';

/**
 * Observable entity contract.
 *
 * - `getEntityObservable()` / `subscribeEntityEvents()` for lifecycle events
 * - `getPropertyObservable()` / `subscribePropertyEvents()` for property change events
 */
export interface IObservable {
  /**
   * Returns an observable stream of entity lifecycle events.
   *
   * @returns {Observable<IObservableEvent<unknown>>} Entity lifecycle events stream.
   */
  getEntityObservable(): Observable<IObservableEvent<unknown>>;

  /**
   * Returns an observable stream of property change events.
   *
   * @returns {Observable<IPropertyEvent>} Property change events stream.
   */
  getPropertyObservable(): Observable<IPropertyEvent>;

  /**
   * Subscribes to entity lifecycle events.
   *
   * @param {(data: IObservableEvent<unknown>) => void} handler - Event handler.
   * @returns {Subscription} Subscription instance.
   */
  subscribeEntityEvents(
    handler: (data: IObservableEvent<unknown>) => void,
  ): Subscription;

  /**
   * Subscribes to property change events.
   *
   * @param {(data: IPropertyEvent) => void} handler - Event handler.
   * @returns {Subscription} Subscription instance.
   */
  subscribePropertyEvents(
    handler: (data: IPropertyEvent) => void,
  ): Subscription;

  /**
   * Explicit lifecycle hook: `creating`.
   *
   * @returns {void}
   */
  creating(): void;

  /**
   * Explicit lifecycle hook: `created`.
   *
   * @returns {void}
   */
  created(): void;

  /**
   * Explicit lifecycle hook: `updating`.
   *
   * @returns {void}
   */
  updating(): void;

  /**
   * Explicit lifecycle hook: `updated`.
   *
   * @returns {void}
   */
  updated(): void;

  /**
   * Explicit lifecycle hook: `deleting`.
   *
   * @returns {void}
   */
  deleting(): void;

  /**
   * Explicit lifecycle hook: `deleted`.
   *
   * @returns {void}
   */
  deleted(): void;

  /**
   * Explicit lifecycle hook: `restoring`.
   *
   * @returns {void}
   */
  restoring(): void;

  /**
   * Explicit lifecycle hook: `restored`.
   *
   * @returns {void}
   */
  restored(): void;
}
