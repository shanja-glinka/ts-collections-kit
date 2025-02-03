import { cloneDeep } from 'lodash';

/**
 * Функция для глубокого клонирования объекта.
 * Использует функцию cloneDeep из библиотеки lodash.
 *
 * @param value Объект, который требуется клонировать.
 * @returns Глубокая копия переданного объекта.
 */
export function deepClone<T>(value: T): T {
  return cloneDeep(value);
}
