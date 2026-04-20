/**
 * Tests for Channel.recentConversations() and Channel.pinnedConversations()
 * (WS-5: Replace N+1 Graph Walks with SPARQL Model Methods)
 *
 * Validates:
 * 1. recentConversations() issues a single SPARQL query, not N+1 iterative calls
 * 2. pinnedConversations() issues a single SPARQL query
 * 3. Results are deduplicated by channelId
 * 4. Error handling returns empty arrays
 */

import { Channel } from './index';

// --- Mock PerspectiveProxy ---

function createMockPerspective(queryResults: any[] = []) {
  const querySparqlCalls: string[] = [];

  return {
    proxy: {
      querySparql: jest.fn(async (sparql: string) => {
        querySparqlCalls.push(sparql);
        return queryResults;
      }),
    },
    querySparqlCalls,
  };
}

describe('Channel.recentConversations()', () => {
  it('issues exactly 1 SPARQL query', async () => {
    const { proxy, querySparqlCalls } = createMockPerspective([
      { channelId: 'ch1', conversationId: 'conv1', lastActivity: '2026-04-20T10:00:00Z' },
      { channelId: 'ch2', conversationId: 'conv2', lastActivity: '2026-04-20T09:00:00Z' },
    ]);

    const result = await Channel.recentConversations(proxy as any, 20);

    expect(querySparqlCalls).toHaveLength(1);
    expect(result).toHaveLength(2);
    expect(result[0].channelId).toBe('ch1');
    expect(result[1].channelId).toBe('ch2');
  });

  it('deduplicates results by channelId', async () => {
    const { proxy } = createMockPerspective([
      { channelId: 'ch1', conversationId: 'conv1', lastActivity: '2026-04-20T10:00:00Z' },
      { channelId: 'ch1', conversationId: 'conv1b', lastActivity: '2026-04-20T09:00:00Z' },
      { channelId: 'ch2', conversationId: 'conv2', lastActivity: '2026-04-20T08:00:00Z' },
    ]);

    const result = await Channel.recentConversations(proxy as any, 20);

    // ch1 should appear only once (first/most recent row wins)
    expect(result).toHaveLength(2);
    expect(result[0].channelId).toBe('ch1');
    expect(result[0].conversationId).toBe('conv1');
  });

  it('respects the limit parameter in SPARQL', async () => {
    const { proxy, querySparqlCalls } = createMockPerspective([]);

    await Channel.recentConversations(proxy as any, 5);

    expect(querySparqlCalls[0]).toContain('LIMIT 5');
  });

  it('handles empty results', async () => {
    const { proxy } = createMockPerspective([]);

    const result = await Channel.recentConversations(proxy as any, 20);

    expect(result).toEqual([]);
  });

  it('handles null results gracefully', async () => {
    const proxy = {
      querySparql: jest.fn(async () => null),
    };

    const result = await Channel.recentConversations(proxy as any, 20);

    expect(result).toEqual([]);
  });

  it('returns empty array on query error', async () => {
    const proxy = {
      querySparql: jest.fn(async () => {
        throw new Error('SPARQL engine error');
      }),
    };

    const result = await Channel.recentConversations(proxy as any, 20);

    expect(result).toEqual([]);
  });

  it('does NOT iterate over channels (no N+1)', async () => {
    // With 50 channels, the old approach would issue 50+ querySparql calls.
    // The new approach issues exactly 1.
    const manyResults = Array.from({ length: 50 }, (_, i) => ({
      channelId: `ch${i}`,
      conversationId: `conv${i}`,
      lastActivity: new Date(2026, 3, 20, 10, 0, 0, 0).toISOString(),
    }));

    const { proxy, querySparqlCalls } = createMockPerspective(manyResults);

    const result = await Channel.recentConversations(proxy as any, 50);

    // Only 1 SPARQL call — not 50+
    expect(querySparqlCalls).toHaveLength(1);
    expect(result).toHaveLength(50);
  });
});

describe('Channel.pinnedConversations()', () => {
  it('issues exactly 1 SPARQL query', async () => {
    const { proxy, querySparqlCalls } = createMockPerspective([
      { channelId: 'ch1', conversationId: 'conv1' },
      { channelId: 'ch2', conversationId: 'conv2' },
    ]);

    const result = await Channel.pinnedConversations(proxy as any);

    expect(querySparqlCalls).toHaveLength(1);
    expect(result).toHaveLength(2);
  });

  it('deduplicates results by channelId', async () => {
    const { proxy } = createMockPerspective([
      { channelId: 'ch1', conversationId: 'conv1' },
      { channelId: 'ch1', conversationId: 'conv1b' },
    ]);

    const result = await Channel.pinnedConversations(proxy as any);

    expect(result).toHaveLength(1);
    expect(result[0].conversationId).toBe('conv1');
  });

  it('handles channels without conversations', async () => {
    const { proxy } = createMockPerspective([
      { channelId: 'ch1', conversationId: undefined },
    ]);

    const result = await Channel.pinnedConversations(proxy as any);

    expect(result).toHaveLength(1);
    expect(result[0].channelId).toBe('ch1');
    expect(result[0].conversationId).toBeUndefined();
  });

  it('returns empty array on query error', async () => {
    const proxy = {
      querySparql: jest.fn(async () => {
        throw new Error('SPARQL engine error');
      }),
    };

    const result = await Channel.pinnedConversations(proxy as any);

    expect(result).toEqual([]);
  });

  it('SPARQL query filters for pinned channels', async () => {
    const { proxy, querySparqlCalls } = createMockPerspective([]);

    await Channel.pinnedConversations(proxy as any);

    expect(querySparqlCalls[0]).toContain('channel_is_pinned');
    expect(querySparqlCalls[0]).toContain('"true"');
  });
});
