import { describe, it, expect, vi } from 'vitest';
import { Channel } from './index';

// Mock perspective that tracks SPARQL calls
function createMockPerspective() {
  const sparqlCalls: string[] = [];
  return {
    sparqlCalls,
    querySparql: vi.fn(async (query: string) => {
      sparqlCalls.push(query);
      return [];
    }),
    get: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue({}),
  };
}

describe('Channel.recentConversations()', () => {
  it('issues a single SPARQL query with GROUP BY', async () => {
    const perspective = createMockPerspective();
    const results = await Channel.recentConversations(perspective as any, 20);

    expect(perspective.querySparql).toHaveBeenCalledTimes(1);
    const query = perspective.sparqlCalls[0];
    expect(query).toContain('GROUP BY');
    expect(query).toContain('ORDER BY');
    expect(query).toContain('LIMIT');
    expect(results).toEqual([]);
  });

  it('returns mapped results with channelId, conversationId, lastActivity', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockResolvedValueOnce([
      { channelId: 'ch-1', conversationId: 'conv-1', lastActivity: '2026-04-20T10:00:00Z' },
      { channelId: 'ch-2', conversationId: null, lastActivity: '2026-04-19T10:00:00Z' },
    ]);

    const results = await Channel.recentConversations(perspective as any, 20);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      channelId: 'ch-1',
      conversationId: 'conv-1',
      lastActivity: '2026-04-20T10:00:00Z',
    });
    expect(results[1].channelId).toBe('ch-2');
    // null conversationId should become undefined
    expect(results[1].conversationId).toBeUndefined();
  });

  it('deduplicates by channelId', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockResolvedValueOnce([
      { channelId: 'ch-1', conversationId: 'conv-1', lastActivity: '2026-04-20T10:00:00Z' },
      { channelId: 'ch-1', conversationId: 'conv-2', lastActivity: '2026-04-20T09:00:00Z' },
    ]);

    const results = await Channel.recentConversations(perspective as any, 20);
    expect(results).toHaveLength(1);
    expect(results[0].conversationId).toBe('conv-1'); // First seen wins
  });

  it('handles errors gracefully', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockRejectedValueOnce(new Error('SPARQL error'));

    const results = await Channel.recentConversations(perspective as any, 20);
    expect(results).toEqual([]);
  });

  it('respects the limit parameter', async () => {
    const perspective = createMockPerspective();
    await Channel.recentConversations(perspective as any, 5);

    const query = perspective.sparqlCalls[0];
    expect(query).toContain('LIMIT 5');
  });

  it('handles null/empty query results', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockResolvedValueOnce(null as any);

    const results = await Channel.recentConversations(perspective as any, 20);
    expect(results).toEqual([]);
  });
});

describe('Channel.pinnedConversations()', () => {
  it('issues a single SPARQL query', async () => {
    const perspective = createMockPerspective();
    await Channel.pinnedConversations(perspective as any);
    expect(perspective.querySparql).toHaveBeenCalledTimes(1);
  });

  it('queries for pinned channels', async () => {
    const perspective = createMockPerspective();
    await Channel.pinnedConversations(perspective as any);

    const query = perspective.sparqlCalls[0];
    expect(query).toContain('"true"');
    expect(query).toContain('?channelId');
  });

  it('returns mapped results', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockResolvedValueOnce([
      { channelId: 'ch-1', conversationId: 'conv-1' },
    ]);

    const results = await Channel.pinnedConversations(perspective as any);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ channelId: 'ch-1', conversationId: 'conv-1' });
  });

  it('deduplicates by channelId', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockResolvedValueOnce([
      { channelId: 'ch-1', conversationId: 'conv-1' },
      { channelId: 'ch-1', conversationId: 'conv-2' },
    ]);

    const results = await Channel.pinnedConversations(perspective as any);
    expect(results).toHaveLength(1);
  });

  it('handles errors gracefully', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockRejectedValueOnce(new Error('SPARQL error'));

    const results = await Channel.pinnedConversations(perspective as any);
    expect(results).toEqual([]);
  });
});
