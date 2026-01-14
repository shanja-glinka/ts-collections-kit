import { BaseCollection } from '../collections/base-collection';
import { CollectAdapter } from '../collections/collect-adapter';

describe('Collect.js adapter compatibility', () => {
  it('replaces items via adapter and stays consistent with collect.js API', () => {
    const collection = new BaseCollection<number>([1, 2, 3]);
    const adapter = new CollectAdapter<number>();

    adapter.replaceItems(collection, [42]);

    expect(collection.all()).toEqual([42]);
    expect(collection.count()).toBe(1);
  });

  it('exposes key collect.js methods for smoke compatibility', () => {
    const collection = new BaseCollection<number>([1, 2, 3, 4]);

    expect(typeof collection.skip).toBe('function');
    expect(typeof collection.where).toBe('function');
    expect(typeof collection.map).toBe('function');
    expect(typeof collection.filter).toBe('function');

    // runtime check
    expect(collection.skip(1).all()).toEqual([2, 3, 4]);
    expect(collection.where('toString', '2').count()).toBe(0); // method exists; behavior may differ but call should not throw
  });
});
