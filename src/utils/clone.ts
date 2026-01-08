import lodash from 'lodash';

/**
 * Deep-clone a value.
 *
 * This is a small wrapper around `lodash/cloneDeep` to keep the dependency usage centralized.
 *
 * @template T
 * @param {T} value - Value to clone.
 * @returns {T} Deep clone of the input value.
 */
export function deepClone<T>(value: T): T {
  return lodash.cloneDeep(value);
}
