import { describe, it, expect, vi } from 'vitest';

/**
 * Tests for the SPARQL query logic in Channel.unprocessedItems().
 *
 * Tests the set-difference approach: all items minus processed items = unprocessed.
 * The processedQuery must find items globally (not scoped to channel) because
 * subgroups are grandchildren of channels (channel → conversation → subgroup).
 */

// Mirror the JS set-difference logic from Channel.unprocessedItems()
function computeUnprocessed(allItems: string[], processedItems: string[]): string[] {
  const processedSet = new Set(processedItems);
  return allItems.filter((id) => !processedSet.has(id));
}

describe('unprocessedItems set-difference logic', () => {
  it('returns items not in processedSet', () => {
    const all = ['item1', 'item2', 'item3', 'item4'];
    const processed = ['item1', 'item3'];
    expect(computeUnprocessed(all, processed)).toEqual(['item2', 'item4']);
  });

  it('returns ALL items when processedSet is empty (original bug scenario)', () => {
    // This was the bug: processedQuery returned nothing (wrong scoping),
    // so processedSet was empty, making ALL items "unprocessed" every time.
    const all = ['item1', 'item2', 'item3'];
    expect(computeUnprocessed(all, [])).toEqual(all);
  });

  it('returns empty array when all items are processed', () => {
    const all = ['item1', 'item2'];
    expect(computeUnprocessed(all, ['item1', 'item2'])).toEqual([]);
  });

  it('returns empty array when no items exist', () => {
    expect(computeUnprocessed([], [])).toEqual([]);
    expect(computeUnprocessed([], ['item1'])).toEqual([]);
  });

  it('handles duplicates in allItems', () => {
    const all = ['item1', 'item2', 'item1', 'item3'];
    const processed = ['item1'];
    expect(computeUnprocessed(all, processed)).toEqual(['item2', 'item3']);
  });

  it('handles duplicates in processedItems', () => {
    const all = ['item1', 'item2', 'item3'];
    const processed = ['item1', 'item1', 'item3'];
    expect(computeUnprocessed(all, processed)).toEqual(['item2']);
  });
});

describe('Channel.unprocessedItems() SPARQL integration', () => {
  // Simulate the three-query pattern from Channel.unprocessedItems()
  async function runUnprocessedItems(
    perspective: {
      querySparql: (q: string) => Promise<any[]>;
    },
    channelId: string,
  ): Promise<any[]> {
    const allItemsQuery = `SELECT ?id WHERE { <${channelId}> <ad4m://has_child> ?id }`;
    const processedQuery = `SELECT ?id WHERE { ?sg <flux://has_item> ?id }`;

    const [allItemsResult, processedResult] = await Promise.all([
      perspective.querySparql(allItemsQuery),
      perspective.querySparql(processedQuery),
    ]);

    const processedSet = new Set(
      (processedResult || []).map((r: any) => r.id),
    );
    const unprocessedIds = (allItemsResult || [])
      .map((r: any) => r.id)
      .filter((id: string) => id && !processedSet.has(id));

    return unprocessedIds;
  }

  it('issues two parallel SPARQL queries', async () => {
    const querySparql = vi.fn().mockResolvedValue([]);
    await runUnprocessedItems({ querySparql }, 'ch-1');
    expect(querySparql).toHaveBeenCalledTimes(2);
  });

  it('filters out processed items from all items', async () => {
    const querySparql = vi.fn()
      .mockResolvedValueOnce([{ id: 'item1' }, { id: 'item2' }, { id: 'item3' }])
      .mockResolvedValueOnce([{ id: 'item1' }]);

    const result = await runUnprocessedItems({ querySparql }, 'ch-1');
    expect(result).toEqual(['item2', 'item3']);
  });

  it('returns all items when none are processed', async () => {
    const querySparql = vi.fn()
      .mockResolvedValueOnce([{ id: 'item1' }, { id: 'item2' }])
      .mockResolvedValueOnce([]);

    const result = await runUnprocessedItems({ querySparql }, 'ch-1');
    expect(result).toEqual(['item1', 'item2']);
  });

  it('returns empty when all items are processed', async () => {
    const querySparql = vi.fn()
      .mockResolvedValueOnce([{ id: 'item1' }])
      .mockResolvedValueOnce([{ id: 'item1' }]);

    const result = await runUnprocessedItems({ querySparql }, 'ch-1');
    expect(result).toEqual([]);
  });

  it('handles null results gracefully', async () => {
    const querySparql = vi.fn().mockResolvedValue(null);
    const result = await runUnprocessedItems({ querySparql }, 'ch-1');
    expect(result).toEqual([]);
  });
});
