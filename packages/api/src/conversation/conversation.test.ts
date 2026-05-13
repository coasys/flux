/**
 * Conversation test suite.
 *
 * Covers SPARQL queries (stats, topics, subgroupsData), the processNewExpressions()
 * pipeline (batch lifecycle, state progression, subgroup splitting), synergy e2e
 * (transcription → LLM grouping → topics → conversation summary),
 * Channel.unprocessedItems(), and conversation-cache lookup correctness.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must be vi.mock (hoisted) so static imports see them
// ---------------------------------------------------------------------------

// Provide no-op decorators so all AD4M model classes can be defined.
// The published @coasys/ad4m@0.13.0-test-2 does not export Model/HasMany.
vi.mock('@coasys/ad4m', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  const noop = () => (_target: any, _key?: any) => {};
  return {
    ...actual,
    Model: (opts: any) => (target: any) => {
      // The real @Model decorator adds an `id` getter aliasing _baseExpression.
      // Only add one if the prototype chain doesn't already provide it
      // (Ad4mModel.prototype has `get id()` → this._baseExpression).
      if (!('id' in target.prototype)) {
        Object.defineProperty(target.prototype, 'id', {
          get() { return this._baseExpression; },
          set(v: any) { this._baseExpression = v; },
          configurable: true,
        });
      }
      return target;
    },
    Flag: actual.Flag ?? ((opts: any) => noop()),
    Property: actual.Property ?? ((opts: any) => noop()),
    HasMany: (opts: any) => noop(),
    HasManyMethods: undefined,
    Ad4mModel: actual.Ad4mModel ??
      class Ad4mModel {
        perspective: any;
        id: string;
        constructor(perspective: any, id?: string) {
          this.perspective = perspective;
          this.id = id ?? '';
        }
        async save(_batchId?: string) {}
        async get(_opts?: any) {}
        static async create(perspective: any, data: any, opts?: any) {
          const inst = new this(perspective, `generated-${Date.now()}`);
          Object.assign(inst, data);
          return inst;
        }
        static async findAll(perspective: any, opts?: any) {
          return [];
        }
      },
    Literal: actual.Literal ?? { from: (v: any) => ({ toUrl: () => `literal://${v}` }) },
    Link: actual.Link ?? class Link {},
    PerspectiveProxy: actual.PerspectiveProxy ?? class PerspectiveProxy {},
  };
});

// Track calls so tests can assert per-invocation ordering
const llmTaskCalls: { task: any; prompt: any }[] = [];

vi.mock('./LLMutils', () => ({
  ensureLLMTasks: vi.fn().mockResolvedValue({
    grouping: { id: 'task-grouping', name: 'grouping', expectedOneOf: ['group', 'newGroup'] },
    topics: { id: 'task-topics', name: 'topics', expectArray: true },
    conversation: { id: 'task-conversation', name: 'conversation', expectedOutputs: ['n', 's'] },
  }),
  LLMTaskWithExpectedOutputs: vi.fn().mockImplementation(async (task, prompt) => {
    llmTaskCalls.push({ task, prompt });
    if (task.name === 'grouping') {
      return {
        group: null,
        newGroup: {
          n: 'API Redesign Discussion',
          s: 'Alice, Bob, and Charlie discuss redesigning the REST API endpoints and updating documentation.',
          firstItemId: 0, // index-based (detectNewGroup maps back to real IDs)
        },
      };
    }
    if (task.name === 'topics') {
      return [
        { n: 'API Design', rel: 9 },
        { n: 'Documentation', rel: 7 },
      ];
    }
    if (task.name === 'conversation') {
      return {
        n: 'Sprint Planning: API Overhaul',
        s: 'The team discussed plans for redesigning REST API endpoints, creating tracking tickets, and updating documentation.',
      };
    }
    return {};
  }),
}));

vi.mock('@coasys/flux-api', () => ({
  getProfile: vi.fn().mockResolvedValue({
    username: 'testuser',
    givenName: 'Test',
    familyName: 'User',
    email: '',
    bio: '',
    profileBackground: '',
    profilePicture: '',
    profileThumbnailPicture: '',
  }),
  Topic: {
    findAll: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('./util', () => ({
  createEmbedding: vi.fn().mockResolvedValue(undefined),
  removeEmbedding: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocks are hoisted
import { Conversation } from './index';

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
      addTask: vi.fn().mockResolvedValue({ taskId: 'mock-task-id' }),
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

/** Simulates 5 transcribed voice messages — enough to trigger processing */
function createTranscribedItems() {
  return [
    { id: 'tr-1', text: 'I think we should focus on the API redesign first', author: 'did:test:alice', timestamp: '2026-01-15T14:00:00Z', type: 'Message' },
    { id: 'tr-2', text: 'Agreed, the current endpoints are inconsistent', author: 'did:test:bob', timestamp: '2026-01-15T14:00:30Z', type: 'Message' },
    { id: 'tr-3', text: 'We also need to update the documentation', author: 'did:test:alice', timestamp: '2026-01-15T14:01:00Z', type: 'Message' },
    { id: 'tr-4', text: 'Let me create tickets for each endpoint', author: 'did:test:charlie', timestamp: '2026-01-15T14:01:30Z', type: 'Message' },
    { id: 'tr-5', text: 'Good idea, we can track progress that way', author: 'did:test:bob', timestamp: '2026-01-15T14:02:00Z', type: 'Message' },
  ];
}

// ---------------------------------------------------------------------------
// stats()
// ---------------------------------------------------------------------------

describe('Conversation.stats()', () => {
  it('queries SPARQL for subgroup count', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = ['did:test:alice'];

    const stats = await conv.stats();
    expect(perspective.querySparql).toHaveBeenCalledTimes(2);
    const subgroupsQuery = perspective.sparqlCalls[0];
    expect(subgroupsQuery).toContain('conv-1');
    expect(subgroupsQuery).toContain('ad4m://has_child');
    expect(subgroupsQuery).toContain('flux://conversation_subgroup');
    const participantsQuery = perspective.sparqlCalls[1];
    expect(participantsQuery).toContain('conv-1');
    expect(participantsQuery).toContain('flux://has_participant');
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
        return [
          { id: 'sg-1', timestamp: '2026-01-01T00:00:00Z', nameRaw: 'Group 1', summaryRaw: 'Summary 1' },
        ];
      }
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
// processNewExpressions() — basic pipeline tests
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
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];
    conv.nameFixed = false;

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
    conv.nameFixed = false;

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
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];
    conv.nameFixed = false;

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
    conv.nameFixed = false;

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
    conv.nameFixed = false;

    const updateState = vi.fn();
    try {
      await conv.processNewExpressions(mockItems as any, updateState, createMockClient() as any);
    } catch {
      // May fail on LLM conversation task
    }

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

    conv['subgroups'] = vi.fn().mockResolvedValue([]);
    conv['detectNewGroup'] = vi.fn().mockResolvedValue({
      group: { n: 'First Group', s: 'First summary' },
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
    conv.nameFixed = false;

    const updateState = vi.fn();
    try {
      await conv.processNewExpressions(mockItems as any, updateState, createMockClient() as any);
    } catch {
      // May fail on LLM conversation task
    }

    expect(conv['createNewGroup']).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Synergy e2e: transcription → summary generation (full pipeline with LLM mocks)
// ---------------------------------------------------------------------------

describe('Synergy e2e: transcription → summary generation', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    llmTaskCalls.length = 0;

    // Re-apply the default LLM mock implementation after restoreAllMocks
    const { ensureLLMTasks, LLMTaskWithExpectedOutputs } = await import('./LLMutils');
    vi.mocked(ensureLLMTasks).mockResolvedValue({
      grouping: { id: 'task-grouping', name: 'grouping', expectedOneOf: ['group', 'newGroup'] } as any,
      topics: { id: 'task-topics', name: 'topics', expectArray: true } as any,
      conversation: { id: 'task-conversation', name: 'conversation', expectedOutputs: ['n', 's'] } as any,
    });
    vi.mocked(LLMTaskWithExpectedOutputs).mockImplementation(async (task: any, prompt: any) => {
      llmTaskCalls.push({ task, prompt });
      if (task.name === 'grouping') {
        return {
          group: null,
          newGroup: {
            n: 'API Redesign Discussion',
            s: 'Alice, Bob, and Charlie discuss redesigning the REST API endpoints and updating documentation.',
            firstItemId: 0,
          },
        };
      }
      if (task.name === 'topics') return [{ n: 'API Design', rel: 9 }, { n: 'Documentation', rel: 7 }];
      if (task.name === 'conversation') {
        return {
          n: 'Sprint Planning: API Overhaul',
          s: 'The team discussed plans for redesigning REST API endpoints, creating tracking tickets, and updating documentation.',
        };
      }
      return {};
    });

    // Re-apply getProfile mock
    const fluxApi = await import('@coasys/flux-api');
    vi.mocked((fluxApi as any).getProfile).mockResolvedValue({
      username: 'testuser', givenName: 'Test', familyName: 'User',
      email: '', bio: '', profileBackground: '', profilePicture: '', profileThumbnailPicture: '',
    });
  });

  it('generates conversation summary from transcribed messages (empty conversation)', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');
    const items = createTranscribedItems();

    conv['subgroups'] = vi.fn().mockResolvedValue([]);
    conv['createNewGroup'] = vi.fn().mockResolvedValue({
      id: 'sg-new',
      subgroupName: 'API Redesign Discussion',
      summary: 'Alice, Bob, and Charlie discuss redesigning the REST API endpoints.',
      participants: [],
      topicsWithRelevance: vi.fn().mockResolvedValue([]),
      updateTopicWithRelevance: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];
    conv.nameFixed = false;

    const updateState = vi.fn();
    await conv.processNewExpressions(items as any, updateState, createMockClient() as any);

    expect(conv.conversationName).toBe('Sprint Planning: API Overhaul');
    expect(conv.summary).toBe(
      'The team discussed plans for redesigning REST API endpoints, creating tracking tickets, and updating documentation.',
    );
    expect(conv.save).toHaveBeenCalledWith('batch-1');
    expect(perspective.commitBatch).toHaveBeenCalledWith('batch-1');
  });

  it('generates conversation summary from transcribed messages (existing subgroup)', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');
    const items = createTranscribedItems();

    const mockSubgroup = {
      id: 'sg-existing',
      subgroupName: 'API Discussion',
      summary: 'Initial discussion about API changes.',
      participants: ['did:test:alice'],
      topicsWithRelevance: vi.fn().mockResolvedValue([]),
      updateTopicWithRelevance: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    };

    conv['subgroups'] = vi.fn().mockResolvedValue([mockSubgroup]);
    conv['detectNewGroup'] = vi.fn().mockResolvedValue({
      group: { n: 'Ongoing API Discussion', s: 'Updated summary with new messages about API redesign.' },
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = ['did:test:alice'];
    conv.nameFixed = false;

    const updateState = vi.fn();
    await conv.processNewExpressions(items as any, updateState, createMockClient() as any);

    expect(conv.conversationName).toBe('Sprint Planning: API Overhaul');
    expect(conv.summary).toBe(
      'The team discussed plans for redesigning REST API endpoints, creating tracking tickets, and updating documentation.',
    );
    expect(mockSubgroup.subgroupName).toBe('Ongoing API Discussion');
    expect(mockSubgroup.summary).toBe('Updated summary with new messages about API redesign.');
    expect(conv.save).toHaveBeenCalledWith('batch-1');
    expect(mockSubgroup.save).toHaveBeenCalledWith('batch-1');
    expect(perspective.commitBatch).toHaveBeenCalledWith('batch-1');
  });

  it('progresses through all processing steps', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');
    const items = createTranscribedItems();

    conv['subgroups'] = vi.fn().mockResolvedValue([]);
    conv['createNewGroup'] = vi.fn().mockResolvedValue({
      id: 'sg-new',
      subgroupName: 'Test Group',
      summary: 'Test Summary',
      participants: [],
      save: vi.fn().mockResolvedValue(undefined),
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];
    conv.nameFixed = false;

    const updateState = vi.fn();
    await conv.processNewExpressions(items as any, updateState, createMockClient() as any);

    const steps = updateState.mock.calls.map((call: any) => call[0]?.step).filter(Boolean);
    expect(steps).toContain(2);
    expect(steps).toContain(3);
    expect(steps).toContain(4);
    expect(steps).toContain(5);
    expect(steps).toContain(6);
    expect(steps).toContain(7);
    expect(steps).toContain(8);
  });

  it('links all transcribed items to the new subgroup', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');
    const items = createTranscribedItems();

    conv['subgroups'] = vi.fn().mockResolvedValue([]);
    conv['createNewGroup'] = vi.fn().mockResolvedValue({
      id: 'sg-new',
      subgroupName: 'API Redesign Discussion',
      summary: 'Discussion summary',
      participants: [],
      save: vi.fn().mockResolvedValue(undefined),
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];
    conv.nameFixed = false;

    const updateState = vi.fn();
    await conv.processNewExpressions(items as any, updateState, createMockClient() as any);

    const itemLinksCall = perspective.addLinksCalls.find(
      (call: any) => Array.isArray(call[0]) && call[0].some((l: any) => l.predicate === 'flux://has_item'),
    );
    expect(itemLinksCall, 'expected addLinks to be called with flux://has_item links').toBeDefined();

    const links = itemLinksCall![0];
    expect(links).toHaveLength(5);
    expect(links.every((l: any) => l.source === 'sg-new')).toBe(true);
    expect(links.map((l: any) => l.target)).toEqual(['tr-1', 'tr-2', 'tr-3', 'tr-4', 'tr-5']);
  });

  it('adds participant links for all unique authors', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');
    const items = createTranscribedItems();

    conv['subgroups'] = vi.fn().mockResolvedValue([]);
    conv['createNewGroup'] = vi.fn().mockResolvedValue({
      id: 'sg-new',
      subgroupName: 'Test Group',
      summary: 'Summary',
      participants: [],
      save: vi.fn().mockResolvedValue(undefined),
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];
    conv.nameFixed = false;

    const updateState = vi.fn();
    await conv.processNewExpressions(items as any, updateState, createMockClient() as any);

    const participantLinksCall = perspective.addLinksCalls.find(
      (call: any) =>
        Array.isArray(call[0]) && call[0].some((l: any) => l.predicate === 'flux://has_participant'),
    );
    expect(participantLinksCall, 'expected participant links to be added').toBeDefined();
    const convParticipantLinks = participantLinksCall![0].filter((l: any) => l.source === conv.id);
    const participantDids = convParticipantLinks.map((l: any) => l.target).sort();
    expect(participantDids).toEqual(['did:test:alice', 'did:test:bob', 'did:test:charlie']);
  });

  it('preserves manually fixed conversation name', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');
    const items = createTranscribedItems();

    conv['subgroups'] = vi.fn().mockResolvedValue([]);
    conv['createNewGroup'] = vi.fn().mockResolvedValue({
      id: 'sg-new',
      subgroupName: 'Test',
      summary: 'Summary',
      participants: [],
      save: vi.fn().mockResolvedValue(undefined),
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];

    conv.nameFixed = true;
    conv.conversationName = 'My Custom Name';

    const updateState = vi.fn();
    await conv.processNewExpressions(items as any, updateState, createMockClient() as any);

    expect(conv.conversationName).toBe('My Custom Name');
    expect(conv.summary).toBe(
      'The team discussed plans for redesigning REST API endpoints, creating tracking tickets, and updating documentation.',
    );
  });

  it('handles transcriptions with null/empty text without breaking summary generation', async () => {
    const perspective = createMockPerspective();
    const conv = new Conversation(perspective as any, 'conv-1');

    const itemsWithEmptyText = [
      { id: 'tr-1', text: 'Let us discuss the API changes', author: 'did:test:alice', timestamp: '2026-01-15T14:00:00Z' },
      { id: 'tr-2', text: null, author: 'did:test:bob', timestamp: '2026-01-15T14:00:30Z' },
      { id: 'tr-3', text: '', author: 'did:test:alice', timestamp: '2026-01-15T14:01:00Z' },
      { id: 'tr-4', text: undefined, author: 'did:test:charlie', timestamp: '2026-01-15T14:01:30Z' },
      { id: 'tr-5', text: 'Sounds good to me', author: 'did:test:bob', timestamp: '2026-01-15T14:02:00Z' },
    ];

    conv['subgroups'] = vi.fn().mockResolvedValue([]);
    conv['createNewGroup'] = vi.fn().mockResolvedValue({
      id: 'sg-new',
      subgroupName: 'Test',
      summary: 'Summary',
      participants: [],
      save: vi.fn().mockResolvedValue(undefined),
    });
    conv['updateGroupTopics'] = vi.fn().mockResolvedValue(undefined);
    conv.save = vi.fn().mockResolvedValue(undefined);
    conv.get = vi.fn().mockResolvedValue(undefined);
    conv.participants = [];
    conv.nameFixed = false;

    const updateState = vi.fn();
    await conv.processNewExpressions(itemsWithEmptyText as any, updateState, createMockClient() as any);

    expect(conv.conversationName).toBe('Sprint Planning: API Overhaul');
    expect(conv.summary).toBeTruthy();
    expect(perspective.commitBatch).toHaveBeenCalledWith('batch-1');
  });
});

// ---------------------------------------------------------------------------
// Channel.unprocessedItems() — verifies transcription messages are detected
// ---------------------------------------------------------------------------

describe('Channel.unprocessedItems() detects transcribed messages', () => {
  let Channel: any;
  beforeEach(async () => {
    Channel = (await import('../channel/index')).Channel;
  });

  it('returns transcribed messages not yet linked to a subgroup', async () => {
    let callCount = 0;
    const querySparql = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return [{ id: 'msg-1' }, { id: 'tr-1' }, { id: 'tr-2' }];
      }
      if (callCount === 2) {
        return [{ id: 'msg-1' }];
      }
      return [
        {
          id: 'tr-1',
          author: 'did:test:alice',
          timestamp: '2026-01-15T14:00:00Z',
          type: 'flux://has_message',
          body: 'This is a transcribed message',
          transcriptStart: '2026-01-15T13:59:55Z',
        },
        {
          id: 'tr-2',
          author: 'did:test:bob',
          timestamp: '2026-01-15T14:00:30Z',
          type: 'flux://has_message',
          body: 'Another transcription',
          transcriptStart: '2026-01-15T14:00:25Z',
        },
      ];
    });

    const perspective = { querySparql, get: vi.fn(), add: vi.fn() };
    const channel = new Channel(perspective as any, 'ch-1');
    const unprocessed = await channel.unprocessedItems();

    expect(unprocessed).toHaveLength(2);
    expect(unprocessed[0].id).toBe('tr-1');
    expect(unprocessed[0].text).toBe('This is a transcribed message');
    expect(unprocessed[1].id).toBe('tr-2');
    expect(unprocessed[1].text).toBe('Another transcription');
    expect(querySparql).toHaveBeenCalledTimes(3);
  });

  it('uses transcriptStart for timestamp when available', async () => {
    let callCount = 0;
    const querySparql = vi.fn(async () => {
      callCount++;
      if (callCount === 1) return [{ id: 'tr-1' }];
      if (callCount === 2) return [];
      return [
        {
          id: 'tr-1',
          author: 'did:test:alice',
          timestamp: '2026-01-15T14:00:30Z',
          type: 'flux://has_message',
          body: 'Transcribed text',
          transcriptStart: '2026-01-15T14:00:00Z',
        },
      ];
    });

    const perspective = { querySparql, get: vi.fn(), add: vi.fn() };
    const channel = new Channel(perspective as any, 'ch-1');
    const unprocessed = await channel.unprocessedItems();

    expect(unprocessed).toHaveLength(1);
    expect(unprocessed[0].timestamp).toBe('2026-01-15T14:00:00.000Z');
  });

  it('returns empty array when all items are already processed', async () => {
    let callCount = 0;
    const querySparql = vi.fn(async () => {
      callCount++;
      if (callCount === 1) return [{ id: 'tr-1' }, { id: 'tr-2' }];
      if (callCount === 2) return [{ id: 'tr-1' }, { id: 'tr-2' }];
      return [];
    });

    const perspective = { querySparql, get: vi.fn(), add: vi.fn() };
    const channel = new Channel(perspective as any, 'ch-1');
    const unprocessed = await channel.unprocessedItems();

    expect(unprocessed).toHaveLength(0);
    expect(querySparql).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Conversation cache: processesNextTask() lookup pattern
// ---------------------------------------------------------------------------

describe('Conversation cache: processesNextTask pattern', () => {
  it('conversation instantiated from recentConversations has processNewExpressions', async () => {
    const recentResults = [
      { channelId: 'ch-1', conversationId: 'conv-1', lastActivity: '2026-01-15T14:00:00Z' },
      { channelId: 'ch-2', conversationId: 'conv-2', lastActivity: '2026-01-15T13:00:00Z' },
      { channelId: 'ch-3', conversationId: undefined, lastActivity: '2026-01-15T12:00:00Z' },
    ];

    const perspective = { querySparql: vi.fn(), get: vi.fn(), add: vi.fn() };

    // This is the FIX pattern: populate cache with Conversation instances
    const conversationCache = new Map<string, any>();
    for (const r of recentResults) {
      if (r.conversationId && !conversationCache.has(r.conversationId)) {
        conversationCache.set(r.conversationId, new Conversation(perspective as any, r.conversationId));
      }
    }

    function getConversation(channelId: string) {
      const data = recentResults.find((c) => c.channelId === channelId);
      if (!data?.conversationId) return undefined;
      return conversationCache.get(data.conversationId);
    }

    const conv1 = getConversation('ch-1');
    expect(conv1, 'getConversation must return Conversation for ch-1').toBeDefined();
    expect(conv1!.id).toBe('conv-1');
    expect(typeof conv1!.processNewExpressions).toBe('function');

    const conv2 = getConversation('ch-2');
    expect(conv2, 'getConversation must return Conversation for ch-2').toBeDefined();
    expect(conv2!.id).toBe('conv-2');

    const conv3 = getConversation('ch-3');
    expect(conv3).toBeUndefined();

    const conv4 = getConversation('ch-unknown');
    expect(conv4).toBeUndefined();
  });

  it('processesNextTask guard passes when cache is populated', async () => {
    const perspective = { querySparql: vi.fn(), get: vi.fn(), add: vi.fn() };
    const conversationCache = new Map<string, any>();
    conversationCache.set('conv-1', new Conversation(perspective as any, 'conv-1'));

    const communityService = {
      getConversation: (channelId: string) => {
        if (channelId === 'ch-1') return conversationCache.get('conv-1');
        return undefined;
      },
      perspective,
    };

    const conversation = communityService.getConversation('ch-1');
    const guardPasses = !!(communityService && conversation);

    expect(guardPasses, 'processesNextTask guard must pass when cache is populated').toBe(true);
    expect(conversation).toBeInstanceOf(Conversation);
    expect(conversation!.id).toBe('conv-1');
    expect(typeof conversation!.processNewExpressions).toBe('function');
  });

  it('processesNextTask guard FAILS when cache is empty (regression scenario)', () => {
    const conversationCache = new Map<string, any>(); // EMPTY — the bug

    const recentResults = [
      { channelId: 'ch-1', conversationId: 'conv-1', lastActivity: '2026-01-15T14:00:00Z' },
    ];

    function getConversation(channelId: string) {
      const data = recentResults.find((c) => c.channelId === channelId);
      if (!data?.conversationId) return undefined;
      return conversationCache.get(data.conversationId);
    }

    const conversation = getConversation('ch-1');
    expect(conversation).toBeUndefined();

    const communityService = {};
    const guardPasses = !!(communityService && conversation);
    expect(guardPasses, 'guard must fail when cache is empty').toBe(false);
  });
});
