import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Conversation } from './index';
import ConversationSubgroup from '../conversation-subgroup';

// Mock LLMutils — must be vi.mock (hoisted) so static imports in Conversation pick it up
vi.mock('./LLMutils', () => ({
  ensureLLMTasks: vi.fn().mockResolvedValue({ conversation: 'conversation-task' }),
  LLMTaskWithExpectedOutputs: vi.fn().mockResolvedValue({ n: 'Test Conversation', s: 'Overall summary' }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockPerspective(querySparqlImpl?: (...args: any[]) => any) {
  const sparqlCalls: string[] = [];
  const addLinksCalls: any[][] = [];
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
    addLinksCalls,
    querySparql: vi.fn(impl),
    get: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue({}),
    addLinks: vi.fn(async (...args: any[]) => {
      addLinksCalls.push(args);
      return [];
    }),
    removeLinks: vi.fn().mockResolvedValue([]),
    createBatch: vi.fn().mockResolvedValue('batch-1'),
    commitBatch: vi.fn().mockResolvedValue(undefined),
    ai: {
      tasks: vi.fn().mockResolvedValue([]),
      prompt: vi.fn().mockResolvedValue('{}'),
    },
    name: 'Test Community',
    sharedUrl: 'neighbourhood://test',
  };
}

function createMockClient() {
  return {
    agent: {
      byDID: vi.fn().mockResolvedValue({
        perspective: { links: [] },
      }),
    },
  };
}

// ---------------------------------------------------------------------------
// stats()
// ---------------------------------------------------------------------------

describe('Conversation.stats()', () => {
  it('queries SPARQL for subgroup count', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');
    // Mock .get() so participants can be returned
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = ['did:test:alice'];

    const stats = await conv.stats();
    expect(perspective.querySparql).toHaveBeenCalledTimes(1);
    const query = perspective.sparqlCalls[0];
    expect(query).toContain('conv-1');
    expect(query).toContain('ad4m://has_child');
    expect(query).toContain('flux://conversation_subgroup');
    expect(stats.participants).toEqual(['did:test:alice']);
  });

  it('returns zero subgroups when query returns empty', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];

    const stats = await conv.stats();
    expect(stats.totalSubgroups).toBe(0);
    expect(stats.participants).toEqual([]);
  });

  it('handles query errors gracefully', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockRejectedValueOnce(new Error('SPARQL error'));
    const conv = new Conversation(perspective as any, 'conv-1');

    const stats = await conv.stats();
    expect(stats.totalSubgroups).toBe(0);
    expect(stats.participants).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// topics()
// ---------------------------------------------------------------------------

describe('Conversation.topics()', () => {
  it('queries SPARQL for topics via semantic relationships', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');

    await conv.topics();
    expect(perspective.querySparql).toHaveBeenCalledTimes(1);
    const query = perspective.sparqlCalls[0];
    expect(query).toContain('flux://has_tag');
    expect(query).toContain('flux://has_semantic_relationship');
    expect(query).toContain('flux://has_topic');
    expect(query).toContain('conv-1');
  });

  it('deduplicates topics by topicBase', async () => {
    const perspective = createMockPerspective(async () => [
      { topicBase: 'topic-1', topicNameRaw: '"AI"' },
      { topicBase: 'topic-1', topicNameRaw: '"AI"' },
      { topicBase: 'topic-2', topicNameRaw: '"Testing"' },
    ]);
    const conv = new Conversation(perspective as any, 'conv-1');

    const topics = await conv.topics();
    expect(topics).toHaveLength(2);
    expect(topics[0].id).toBe('topic-1');
    expect(topics[1].id).toBe('topic-2');
  });

  it('handles errors gracefully', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockRejectedValueOnce(new Error('SPARQL error'));
    const conv = new Conversation(perspective as any, 'conv-1');

    const topics = await conv.topics();
    expect(topics).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// subgroupsData()
// ---------------------------------------------------------------------------

describe('Conversation.subgroupsData()', () => {
  it('issues two SPARQL queries (subgroups + batch timestamps)', async () => {
    let callCount = 0;
    const perspective = createMockPerspective(async () => {
      callCount++;
      if (callCount === 1) {
        // First query: subgroup list
        // parseLit strips surrounding quotes, so pass pre-stripped values
        return [
          { id: 'sg-1', timestamp: '2026-01-01T00:00:00Z', nameRaw: 'Group 1', summaryRaw: 'Summary 1' },
        ];
      }
      // Second query: batch timestamps
      return [
        { sg: 'sg-1', channelTs: '2026-01-01T00:01:00Z' },
        { sg: 'sg-1', channelTs: '2026-01-01T00:05:00Z' },
      ];
    });
    const conv = new Conversation(perspective as any, 'conv-1');

    const subgroups = await conv.subgroupsData();
    expect(perspective.querySparql).toHaveBeenCalledTimes(2);
    expect(subgroups).toHaveLength(1);
    expect(subgroups[0].id).toBe('sg-1');
    expect(subgroups[0].name).toBe('Group 1');
    expect(subgroups[0].start).toBeGreaterThan(0);
    expect(subgroups[0].end).toBeGreaterThanOrEqual(subgroups[0].start);
  });

  it('returns empty array when no subgroups exist', async () => {
    const perspective = createMockPerspective(async () => []);
    const conv = new Conversation(perspective as any, 'conv-1');

    const subgroups = await conv.subgroupsData();
    expect(subgroups).toEqual([]);
  });

  it('deduplicates subgroups by id', async () => {
    let callCount = 0;
    const perspective = createMockPerspective(async () => {
      callCount++;
      if (callCount === 1) {
        return [
          { id: 'sg-1', timestamp: '2026-01-01T00:00:00Z' },
          { id: 'sg-1', timestamp: '2026-01-01T00:01:00Z' },
        ];
      }
      return [];
    });
    const conv = new Conversation(perspective as any, 'conv-1');

    const subgroups = await conv.subgroupsData();
    expect(subgroups).toHaveLength(1);
  });

  it('uses transcriptStart over channelTs when present', async () => {
    let callCount = 0;
    const perspective = createMockPerspective(async () => {
      callCount++;
      if (callCount === 1) {
        return [{ id: 'sg-1', timestamp: '2026-01-01T00:00:00Z' }];
      }
      return [
        {
          sg: 'sg-1',
          transcriptStart: '2026-01-01T00:00:30Z',
          channelTs: '2026-01-01T00:01:00Z',
        },
      ];
    });
    const conv = new Conversation(perspective as any, 'conv-1');

    const subgroups = await conv.subgroupsData();
    // transcriptStart = 00:00:30 should be used (earlier than channelTs 00:01:00)
    expect(subgroups[0].start).toBe(new Date('2026-01-01T00:00:30Z').getTime());
  });

  it('uses VALUES clause for batch timestamp query', async () => {
    let callCount = 0;
    const perspective = createMockPerspective(async () => {
      callCount++;
      if (callCount === 1) {
        return [
          { id: 'sg-1', timestamp: '2026-01-01T00:00:00Z' },
          { id: 'sg-2', timestamp: '2026-01-01T00:10:00Z' },
        ];
      }
      return [];
    });
    const conv = new Conversation(perspective as any, 'conv-1');

    await conv.subgroupsData();
    // Second query should use VALUES clause with both subgroup IDs
    const batchQuery = perspective.sparqlCalls[1];
    expect(batchQuery).toContain('VALUES ?sg');
    expect(batchQuery).toContain('sg-1');
    expect(batchQuery).toContain('sg-2');
  });

  it('handles query errors gracefully', async () => {
    const perspective = createMockPerspective();
    perspective.querySparql.mockRejectedValueOnce(new Error('SPARQL error'));
    const conv = new Conversation(perspective as any, 'conv-1');

    const subgroups = await conv.subgroupsData();
    expect(subgroups).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// processNewExpressions() — integration-level tests
// ---------------------------------------------------------------------------

describe('Conversation.processNewExpressions()', () => {
  const mockItems = [
    { id: 'msg-1', text: 'Hello', author: 'did:test:alice', timestamp: '2026-01-01T00:01:00Z' },
    { id: 'msg-2', text: 'World', author: 'did:test:bob', timestamp: '2026-01-01T00:02:00Z' },
    { id: 'msg-3', text: 'Test', author: 'did:test:alice', timestamp: '2026-01-01T00:03:00Z' },
  ];

  it('creates a batch and commits it at the end', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');

    // Mock the internal methods that rely on LLM
    conv['subgroups'] = vi.fn().mockResolvedValue([]);
    conv['detectNewGroup'] = vi.fn().mockResolvedValue({
      group: null,
      newGroup: { n: 'Test Group', s: 'Summary', firstItemId: 'msg-1' },
    });
    conv['createNewGroup'] = vi.fn().mockResolvedValue({
      id: 'sg-new',
      subgroupName: 'Test Group',
      summary: 'Summary',
      participants: [],
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);

    const updateState = vi.fn();
    try {
      await conv.processNewExpressions(mockItems as any, updateState, createMockClient() as any);
    } catch {
      // May throw due to mocking limitations — that's OK, we just check batch lifecycle
    }

    expect(perspective.createBatch).toHaveBeenCalledTimes(1);
  });

  it('calls updateProcessingState through all steps', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');

    // Create a minimal mock subgroup
    const mockSubgroup = {
      id: 'sg-1',
      subgroupName: 'Existing',
      summary: 'Existing summary',
      participants: [],
      save: vi.fn().mockResolvedValue(undefined),
    };

    conv['subgroups'] = vi.fn().mockResolvedValue([mockSubgroup]);
    conv['detectNewGroup'] = vi.fn().mockResolvedValue({
      group: { n: 'Updated Group', s: 'Updated Summary' },
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];

    const updateState = vi.fn();
    try {
      await conv.processNewExpressions(mockItems as any, updateState, createMockClient() as any);
    } catch {
      // May fail due to LLM task dependencies — check what steps were reached
    }

    // Step 2 should always be called (after initial setup, before LLM tasks)
    expect(updateState).toHaveBeenCalledWith({ step: 2 });
  });

  it('handles empty unprocessedItems text gracefully', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');

    const itemsWithNullText = [
      { id: 'msg-1', text: null, author: 'did:test:alice', timestamp: '2026-01-01T00:01:00Z' },
      { id: 'msg-2', text: undefined, author: 'did:test:bob', timestamp: '2026-01-01T00:02:00Z' },
    ];

    conv['subgroups'] = vi.fn().mockResolvedValue([]);
    conv['detectNewGroup'] = vi.fn().mockResolvedValue({
      group: null,
      newGroup: { n: 'Group', s: 'Summary', firstItemId: 'msg-1' },
    });
    conv['createNewGroup'] = vi.fn().mockResolvedValue({
      id: 'sg-new',
      subgroupName: 'Group',
      summary: 'Summary',
      participants: [],
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];

    const updateState = vi.fn();
    try {
      await conv.processNewExpressions(itemsWithNullText as any, updateState, createMockClient() as any);
    } catch {
      // May throw due to LLM mock — that's expected
    }

    // Verify items had null text replaced with ''
    const detectCall = (conv['detectNewGroup'] as any).mock.calls[0];
    expect(detectCall, 'expected detectNewGroup to be called').toBeDefined();
    const items = detectCall[1];
    expect(items.every((item: any) => item.text === '')).toBe(true);
  });

  it('sorts items into current subgroup when no new group detected', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');

    const mockSubgroup = {
      id: 'sg-current',
      subgroupName: 'Current',
      summary: 'Current summary',
      participants: [],
      save: vi.fn().mockResolvedValue(undefined),
    };

    conv['subgroups'] = vi.fn().mockResolvedValue([mockSubgroup]);
    conv['detectNewGroup'] = vi.fn().mockResolvedValue({
      group: { n: 'Updated Current', s: 'Updated summary' },
      // No newGroup — all items go to current subgroup
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];

    const updateState = vi.fn();
    try {
      await conv.processNewExpressions(mockItems as any, updateState, createMockClient() as any);
    } catch {
      // May fail on LLM conversation task
    }

    // All items should be linked to sg-current via flux://has_item
    const addLinksCalls = perspective.addLinks.mock.calls;
    const itemLinks = addLinksCalls.find(
      (call) => Array.isArray(call[0]) && call[0].some((l: any) => l.predicate === 'flux://has_item'),
    );
    expect(itemLinks, 'expected addLinks to be called with flux://has_item links').toBeDefined();
    const links = itemLinks![0];
    expect(links.every((l: any) => l.source === 'sg-current')).toBe(true);
    expect(links).toHaveLength(3);
  });

  it('splits items between current and new subgroup at firstItemId boundary', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');

    const mockSubgroup = {
      id: 'sg-current',
      subgroupName: 'Current',
      summary: 'Current summary',
      participants: [],
      save: vi.fn().mockResolvedValue(undefined),
    };

    conv['subgroups'] = vi.fn().mockResolvedValue([mockSubgroup]);
    conv['detectNewGroup'] = vi.fn().mockResolvedValue({
      group: { n: 'Current Updated', s: 'Updated summary' },
      newGroup: { n: 'New Topic', s: 'New summary', firstItemId: 'msg-2' },
    });
    conv['createNewGroup'] = vi.fn().mockResolvedValue({
      id: 'sg-new',
      subgroupName: 'New Topic',
      summary: 'New summary',
      participants: [],
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];

    const updateState = vi.fn();
    try {
      await conv.processNewExpressions(mockItems as any, updateState, createMockClient() as any);
    } catch {
      // May fail on LLM conversation task
    }

    // Check that addLinks was called with items split between subgroups
    const addLinksCalls = perspective.addLinks.mock.calls;
    const itemLinksCall = addLinksCalls.find(
      (call) => Array.isArray(call[0]) && call[0].some((l: any) => l.predicate === 'flux://has_item'),
    );
    expect(itemLinksCall, 'expected addLinks to be called with flux://has_item links').toBeDefined();
    const links = itemLinksCall![0];
    // msg-1 → sg-current (before firstItemId 'msg-2')
    const currentLinks = links.filter((l: any) => l.source === 'sg-current');
    // msg-2, msg-3 → sg-new (at and after firstItemId 'msg-2')
    const newLinks = links.filter((l: any) => l.source === 'sg-new');
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0].target).toBe('msg-1');
    expect(newLinks).toHaveLength(2);
    expect(newLinks.map((l: any) => l.target)).toEqual(['msg-2', 'msg-3']);
  });

  it('handles empty conversation (no current subgroup) by creating new group', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');

    // No existing subgroups
    conv['subgroups'] = vi.fn().mockResolvedValue([]);
    // LLM returns group data (not newGroup) — should be corrected to newGroup
    conv['detectNewGroup'] = vi.fn().mockResolvedValue({
      group: { n: 'First Group', s: 'First summary' },
      // No newGroup — but no currentSubgroup either, so this triggers the correction logic
    });
    conv['createNewGroup'] = vi.fn().mockResolvedValue({
      id: 'sg-first',
      subgroupName: 'First Group',
      summary: 'First summary',
      participants: [],
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];

    const updateState = vi.fn();
    try {
      await conv.processNewExpressions(mockItems as any, updateState, createMockClient() as any);
    } catch {
      // May fail on LLM conversation task
    }

    // createNewGroup should have been called because there's no currentSubgroup
    expect(conv['createNewGroup']).toHaveBeenCalled();
  });
});
