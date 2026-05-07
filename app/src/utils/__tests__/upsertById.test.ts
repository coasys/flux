import { upsertById } from '../upsertById';

describe('upsertById', () => {
  it('appends a new item when the id is missing', () => {
    const items = [{ id: 'a', name: 'Alpha' }];
    const result = upsertById(items, { id: 'b', name: 'Beta' });

    expect(result).toEqual([
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ]);
    expect(result).not.toBe(items);
    expect(items).toEqual([{ id: 'a', name: 'Alpha' }]);
  });

  it('replaces an existing item with the same id', () => {
    const items = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Old Beta' },
    ];
    const result = upsertById(items, { id: 'b', name: 'New Beta' });

    expect(result).toEqual([
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'New Beta' },
    ]);
    expect(result).not.toBe(items);
    expect(items).toEqual([
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Old Beta' },
    ]);
  });
});
