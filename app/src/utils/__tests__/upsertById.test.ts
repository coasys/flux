import { upsertById } from '../upsertById';

describe('upsertById', () => {
  it('appends a new item when the id is missing', () => {
    const items = [{ id: 'a', name: 'Alpha' }];

    expect(upsertById(items, { id: 'b', name: 'Beta' })).toEqual([
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ]);
  });

  it('replaces an existing item with the same id', () => {
    const items = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Old Beta' },
    ];

    expect(upsertById(items, { id: 'b', name: 'New Beta' })).toEqual([
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'New Beta' },
    ]);
  });
});
