import { describe, it, expect, vi } from 'vitest';
import { Channel } from './index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockPerspective(querySparqlImpl?: (...args: any[]) => any) {
  const sparqlCalls: string[] = [];
  const defaultImpl = async (query: string) => {
    sparqlCalls.push(query);
    return [];
  };
  const impl = querySparqlImpl
    ? async (...args: any[]) => {
        sparqlCalls.push(args[0]);
        return querySparqlImpl(...args);
      }
    : defaultImpl;
  return {
    sparqlCalls,
    querySparql: vi.fn(impl),
    get: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue({}),
  };
}

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

describe('Channel.recentConversations()', () => {
  it('returns empty array when perspective has no data', async () => {
    const perspective = createMockPerspective();
    const results = await Channel.recentConversations(perspective as any, 20);
    expect(results).toEqual([]);
  });

  it('returns conversation channels sorted by most recent activity', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockResolvedValue([
      { channelId: 'ch-1', isConv: 'true', conversationId: 'conv-1' },
      { channelId: 'ch-2', isConv: 'true', conversationId: null },
    ]);
    perspective.get
      .mockResolvedValueOnce([{ timestamp: '2026-04-19T10:00:00Z' }])
      .mockResolvedValueOnce([{ timestamp: '2026-04-20T10:00:00Z' }]);

    const results = await Channel.recentConversations(perspective as any, 20);

    expect(results).toHaveLength(2);
    // ch-2 has the more recent activity, so it should come first
    expect(results[0].channelId).toBe('ch-2');
    expect(results[1].channelId).toBe('ch-1');
    expect(results[1].conversationId).toBe('conv-1');
    // null conversationId should become undefined
    expect(results[0].conversationId).toBeUndefined();
  });

  it('deduplicates by channelId', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockResolvedValue([
      { channelId: 'ch-1', isConv: 'true', conversationId: 'conv-1' },
      { channelId: 'ch-1', isConv: 'true', conversationId: 'conv-2' },
    ]);
    perspective.get.mockResolvedValue([{ timestamp: '2026-04-20T10:00:00Z' }]);

    const results = await Channel.recentConversations(perspective as any, 20);
    expect(results).toHaveLength(1);
  });

  it('returns empty array on error', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockRejectedValue(new Error('SPARQL error'));

    const results = await Channel.recentConversations(perspective as any, 20);
    expect(results).toEqual([]);
  });

  it('respects the limit parameter', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockResolvedValue([
      { channelId: 'ch-1', isConv: 'true' },
      { channelId: 'ch-2', isConv: 'true' },
      { channelId: 'ch-3', isConv: 'true' },
    ]);
    perspective.get.mockResolvedValue([{ timestamp: '2026-04-20T10:00:00Z' }]);

    const results = await Channel.recentConversations(perspective as any, 2);
    expect(results).toHaveLength(2);
  });

  it('handles null query results', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockResolvedValue(null as any);

    const results = await Channel.recentConversations(perspective as any, 20);
    expect(results).toEqual([]);
  });

  it('only includes conversation channels, not regular channels', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockResolvedValue([
      { channelId: 'ch-conv', isConv: 'true' },
      { channelId: 'ch-regular', isConv: 'false' },
    ]);
    perspective.get.mockResolvedValue([{ timestamp: '2026-04-20T10:00:00Z' }]);

    const results = await Channel.recentConversations(perspective as any, 20);
    expect(results).toHaveLength(1);
    expect(results[0].channelId).toBe('ch-conv');
  });
});

describe('Channel.pinnedConversations()', () => {
  it('returns empty array when perspective has no data', async () => {
    const perspective = createMockPerspective();
    const results = await Channel.pinnedConversations(perspective as any);
    expect(results).toEqual([]);
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

// ---------------------------------------------------------------------------
// allItems()
// ---------------------------------------------------------------------------

describe('Channel.allItems()', () => {
  it('uses transcriptStart when present instead of link timestamp', async () => {
    const perspective = createMockPerspective(async () => [
      {
        id: 'msg-1',
        author: 'did:test:alice',
        timestamp: '2026-04-20T10:05:00Z', // link creation (after transcription)
        type: 'flux://has_message',
        body: 'Hello from voice',
        transcriptStart: '2026-04-20T10:00:00Z', // actual speech time
      },
    ]);

    const channel = new Channel(perspective as any, 'channel-1');
    const items = await channel.allItems();

    expect(items).toHaveLength(1);
    expect(items[0].timestamp).toBe('2026-04-20T10:00:00.000Z');
  });

  it('falls back to link timestamp when transcriptStart is absent', async () => {
    const perspective = createMockPerspective(async () => [
      {
        id: 'msg-2',
        author: 'did:test:bob',
        timestamp: '2026-04-20T10:05:00Z',
        type: 'flux://has_message',
        body: 'Typed message',
      },
    ]);

    const channel = new Channel(perspective as any, 'channel-1');
    const items = await channel.allItems();

    expect(items).toHaveLength(1);
    expect(items[0].timestamp).toBe('2026-04-20T10:05:00.000Z');
  });

  it('falls back to link timestamp when transcriptStart is empty string', async () => {
    const perspective = createMockPerspective(async () => [
      {
        id: 'msg-3',
        author: 'did:test:bob',
        timestamp: '2026-04-20T10:05:00Z',
        type: 'flux://has_message',
        body: 'Another message',
        transcriptStart: '',
      },
    ]);

    const channel = new Channel(perspective as any, 'channel-1');
    const items = await channel.allItems();

    expect(items).toHaveLength(1);
    expect(items[0].timestamp).toBe('2026-04-20T10:05:00.000Z');
  });

  it('orders mixed transcription and typed messages by effective timestamp', async () => {
    const perspective = createMockPerspective(async () => [
      {
        id: 'msg-typed',
        author: 'did:test:bob',
        timestamp: '2026-04-20T10:02:00Z',
        type: 'flux://has_message',
        body: 'Typed at 10:02',
      },
      {
        id: 'msg-voice',
        author: 'did:test:alice',
        timestamp: '2026-04-20T10:05:00Z', // saved late
        type: 'flux://has_message',
        body: 'Spoken at 10:01',
        transcriptStart: '2026-04-20T10:01:00Z', // actual speech
      },
    ]);

    const channel = new Channel(perspective as any, 'channel-1');
    const items = await channel.allItems();

    const voice = items.find((i) => i.id === 'msg-voice')!;
    const typed = items.find((i) => i.id === 'msg-typed')!;
    expect(voice.timestamp).toBe('2026-04-20T10:01:00.000Z');
    expect(typed.timestamp).toBe('2026-04-20T10:02:00.000Z');
    expect(voice.timestamp < typed.timestamp).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// unprocessedItems() — transcript timestamp coalescing
// ---------------------------------------------------------------------------

describe('Channel.unprocessedItems() transcript timestamp coalescing', () => {
  // Helper: mock perspective that returns different results per call
  // (unprocessedItems issues 3 queries: allItems, processed, data)
  function createSequentialMockPerspective(responses: (() => any[])[]) {
    let callCount = 0;
    return createMockPerspective(async () => {
      const response = responses[callCount] || (() => []);
      callCount++;
      return response();
    });
  }

  it('uses transcriptStart when present instead of link timestamp', async () => {
    const perspective = createSequentialMockPerspective([
      () => [{ id: 'msg-1' }],
      () => [],
      () => [
        {
          id: 'msg-1',
          author: 'did:test:alice',
          timestamp: '2026-04-20T10:05:00Z',
          type: 'flux://has_message',
          body: 'Voice message',
          transcriptStart: '2026-04-20T10:00:00Z',
        },
      ],
    ]);

    const channel = new Channel(perspective as any, 'channel-1');
    const items = await channel.unprocessedItems();

    expect(items).toHaveLength(1);
    expect(items[0].timestamp).toBe('2026-04-20T10:00:00.000Z');
  });

  it('falls back to link timestamp when transcriptStart is absent', async () => {
    const perspective = createSequentialMockPerspective([
      () => [{ id: 'msg-2' }],
      () => [],
      () => [
        {
          id: 'msg-2',
          author: 'did:test:bob',
          timestamp: '2026-04-20T10:05:00Z',
          type: 'flux://has_message',
          body: 'Typed message',
        },
      ],
    ]);

    const channel = new Channel(perspective as any, 'channel-1');
    const items = await channel.unprocessedItems();

    expect(items).toHaveLength(1);
    expect(items[0].timestamp).toBe('2026-04-20T10:05:00.000Z');
  });

});
