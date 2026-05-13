/**
 * Conversation rename and property update tests.
 *
 * Tests the Ad4mModel dirty-tracking and save pipeline for
 * conversationName, nameFixed, and summary property changes on Conversation instances.
 */
import { describe, it, expect, vi } from 'vitest';

// Provide fallback decorators so model classes can load without the full Rust runtime.
vi.mock('@coasys/ad4m', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  const noop = () => (_target: any, _key?: any) => {};
  return {
    ...actual,
    Model: actual.Model ?? ((opts: any) => (target: any) => target),
    Flag: actual.Flag ?? ((opts: any) => noop()),
    Property: actual.Property ?? ((opts: any) => noop()),
    HasMany: actual.HasMany ?? ((opts: any) => noop()),
    HasManyMethods: undefined,
  };
});

vi.mock('./LLMutils', () => ({
  ensureLLMTasks: vi.fn().mockResolvedValue({}),
  LLMTaskWithExpectedOutputs: vi.fn().mockResolvedValue({}),
}));

vi.mock('@coasys/flux-api', () => ({
  getProfile: vi.fn().mockResolvedValue({
    username: 'testuser', givenName: 'Test', familyName: 'User',
    email: '', bio: '', profileBackground: '', profilePicture: '', profileThumbnailPicture: '',
  }),
  Topic: { findAll: vi.fn().mockResolvedValue([]) },
}));

vi.mock('./util', () => ({
  createEmbedding: vi.fn().mockResolvedValue(undefined),
  removeEmbedding: vi.fn().mockResolvedValue(undefined),
}));

import { Conversation } from './index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockPerspective(instances: any[] = []) {
  const executeActionCalls: any[][] = [];

  return {
    perspective: {
      modelQuery: vi.fn().mockResolvedValue({
        instances,
        totalCount: instances.length,
      }),
      executeAction: vi.fn(async (...args: any[]) => {
        executeActionCalls.push(args);
        return {};
      }),
      createExpression: vi.fn(async (value: any) => `literal://${value}`),
      createBatch: vi.fn().mockResolvedValue('batch-1'),
      commitBatch: vi.fn().mockResolvedValue(undefined),
      stringOrTemplateObjectToSubjectClassName: vi.fn().mockResolvedValue('Conversation'),
      createSubject: vi.fn().mockResolvedValue(undefined),
      querySparql: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue({}),
      addLinks: vi.fn().mockResolvedValue([]),
      removeLinks: vi.fn().mockResolvedValue([]),
      name: 'Test Community',
      sharedUrl: 'neighbourhood://test',
    },
    executeActionCalls,
  };
}

/**
 * Hydrate a Conversation as if it came from `findOne()`.
 * Sets properties and calls the private `takeSnapshot()` to establish
 * the dirty-tracking baseline.
 */
function hydrateConversation(
  perspective: any,
  id: string,
  props: { conversationName?: string; nameFixed?: boolean; summary?: string },
): Conversation {
  const instance = new Conversation(perspective, id);
  if (props.conversationName !== undefined) instance.conversationName = props.conversationName;
  if (props.nameFixed !== undefined) instance.nameFixed = props.nameFixed;
  if (props.summary !== undefined) instance.summary = props.summary;

  // Simulate the snapshot taken by findOne/findAll
  // Pass null for includedRelations to skip relation snapshotting
  (instance as any).takeSnapshot(null);
  return instance;
}

// ---------------------------------------------------------------------------
// Dirty tracking
// ---------------------------------------------------------------------------

describe('Conversation dirty tracking', () => {
  it('is not dirty immediately after hydration', () => {
    const { perspective } = createMockPerspective();
    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Sprint Planning',
      nameFixed: false,
      summary: 'A planning meeting.',
    });

    expect(conv.isDirty()).toBe(false);
    expect(conv.changedFields()).toEqual([]);
  });

  it('marks conversationName as dirty after modification', () => {
    const { perspective } = createMockPerspective();
    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Old Name',
      nameFixed: false,
      summary: 'Summary',
    });

    conv.conversationName = 'New Name';

    expect(conv.isDirty()).toBe(true);
    expect(conv.changedFields()).toContain('conversationName');
    expect(conv.changedFields()).not.toContain('nameFixed');
    expect(conv.changedFields()).not.toContain('summary');
  });

  it('marks nameFixed as dirty after modification', () => {
    const { perspective } = createMockPerspective();
    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Name',
      nameFixed: false,
    });

    conv.nameFixed = true;

    expect(conv.isDirty()).toBe(true);
    expect(conv.changedFields()).toContain('nameFixed');
    expect(conv.changedFields()).not.toContain('conversationName');
  });

  it('tracks both conversationName and nameFixed changes', () => {
    const { perspective } = createMockPerspective();
    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Old Name',
      nameFixed: false,
    });

    conv.conversationName = 'User Renamed';
    conv.nameFixed = true;

    const changed = conv.changedFields();
    expect(changed).toContain('conversationName');
    expect(changed).toContain('nameFixed');
  });

  it('marks summary as dirty after modification', () => {
    const { perspective } = createMockPerspective();
    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Name',
      summary: 'Old summary',
    });

    conv.summary = 'Updated summary with more detail.';

    expect(conv.isDirty()).toBe(true);
    expect(conv.changedFields()).toContain('summary');
  });

  it('is not dirty when value is set back to original', () => {
    const { perspective } = createMockPerspective();
    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Original',
      nameFixed: false,
    });

    conv.conversationName = 'Modified';
    conv.nameFixed = true;
    expect(conv.isDirty()).toBe(true);

    conv.conversationName = 'Original';
    conv.nameFixed = false;
    expect(conv.isDirty()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// save() with correct predicates
// ---------------------------------------------------------------------------

describe('Conversation save with correct predicates', () => {
  it('uses flux://has_name predicate for conversationName', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'conv-1', conversationName: 'New Name' }],
      totalCount: 1,
    });

    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Old Name',
      nameFixed: false,
    });

    conv.conversationName = 'New Name';
    await conv.save();

    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_name',
    );
    expect(nameAction).toBeDefined();
    expect(nameAction![0][0].action).toBe('setSingleTarget');
    expect(nameAction![0][0].source).toBe('this');
    expect(nameAction![0][0].target).toBe('value');
    expect(nameAction![1]).toBe('conv-1'); // baseExpression
  });

  it('uses flux://name_is_fixed predicate for nameFixed', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'conv-1', nameFixed: true }],
      totalCount: 1,
    });

    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Name',
      nameFixed: false,
    });

    conv.nameFixed = true;
    await conv.save();

    const fixedAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://name_is_fixed',
    );
    expect(fixedAction).toBeDefined();
    expect(fixedAction![0][0].action).toBe('setSingleTarget');
  });

  it('uses flux://has_summary predicate for summary', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'conv-1', summary: 'New summary' }],
      totalCount: 1,
    });

    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Name',
      summary: 'Old summary',
    });

    conv.summary = 'New summary';
    await conv.save();

    const summaryAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_summary',
    );
    expect(summaryAction).toBeDefined();
    expect(summaryAction![0][0].action).toBe('setSingleTarget');
  });

  it('saves both conversationName and nameFixed in single save', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'conv-1', conversationName: 'User Name', nameFixed: true }],
      totalCount: 1,
    });

    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Auto Name',
      nameFixed: false,
    });

    conv.conversationName = 'User Name';
    conv.nameFixed = true;
    await conv.save();

    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_name',
    );
    const fixedAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://name_is_fixed',
    );
    expect(nameAction).toBeDefined();
    expect(fixedAction).toBeDefined();
  });

  it('does NOT save unchanged properties', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'conv-1', conversationName: 'New Name' }],
      totalCount: 1,
    });

    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Old Name',
      nameFixed: false,
      summary: 'Summary',
    });

    conv.conversationName = 'New Name';
    await conv.save();

    // Only name should have been saved
    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_name',
    );
    const fixedAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://name_is_fixed',
    );
    const summaryAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_summary',
    );
    expect(nameAction).toBeDefined();
    expect(fixedAction).toBeUndefined();
    expect(summaryAction).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Empty/null value handling
// ---------------------------------------------------------------------------

describe('Conversation empty value handling', () => {
  it('setProperty skips empty string conversationName', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'conv-1', conversationName: '' }],
      totalCount: 1,
    });

    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Original',
    });

    conv.conversationName = '';
    await conv.save();

    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_name',
    );
    expect(nameAction).toBeUndefined();
  });

  it('setProperty skips null summary', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'conv-1', summary: null }],
      totalCount: 1,
    });

    const conv = hydrateConversation(perspective, 'conv-1', {
      summary: 'Original summary',
    });

    (conv as any).summary = null;
    await conv.save();

    const summaryAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_summary',
    );
    expect(summaryAction).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// save() with batchId
// ---------------------------------------------------------------------------

describe('Conversation save with batchId', () => {
  it('passes batchId to executeAction', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Old',
      nameFixed: false,
    });

    conv.conversationName = 'New';
    await conv.save('batch-99');

    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_name',
    );
    expect(nameAction).toBeDefined();
    expect(nameAction![3]).toBe('batch-99');
  });

  it('does NOT call getData when batchId provided', async () => {
    const { perspective } = createMockPerspective();

    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Old',
    });

    conv.conversationName = 'New';
    await conv.save('batch-99');

    expect(perspective.modelQuery).not.toHaveBeenCalled();
  });

  it('takes fresh snapshot after batch save for correct subsequent dirty tracking', async () => {
    const { perspective } = createMockPerspective();

    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Old',
      nameFixed: false,
    });

    conv.conversationName = 'New';
    conv.nameFixed = true;
    await conv.save('batch-99');

    // After batch save, snapshot should be updated
    expect(conv.isDirty()).toBe(false);
    expect(conv.changedFields()).toEqual([]);
    expect(conv.conversationName).toBe('New');
    expect(conv.nameFixed).toBe(true);
  });

  it('subsequent changes after batch save are tracked correctly', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Original',
      nameFixed: false,
    });

    // First save within batch
    conv.conversationName = 'After First Save';
    await conv.save('batch-99');

    // Second modification and save
    conv.conversationName = 'After Second Save';
    expect(conv.isDirty()).toBe(true);
    expect(conv.changedFields()).toContain('conversationName');

    await conv.save('batch-99');

    // Should have saved the name twice
    const nameActions = executeActionCalls.filter(
      (call) => call[0]?.[0]?.predicate === 'flux://has_name',
    );
    expect(nameActions).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// findOne integration (mocked modelQuery)
// ---------------------------------------------------------------------------

describe('Conversation.findOne() hydration', () => {
  it('hydrates instance with correct properties', async () => {
    const { perspective } = createMockPerspective([
      {
        id: 'conv-1',
        conversationName: 'Sprint Review',
        nameFixed: true,
        summary: 'We reviewed the sprint.',
      },
    ]);

    const conv = await Conversation.findOne(perspective as any);

    expect(conv).not.toBeNull();
    expect(conv!.id).toBe('conv-1');
    expect(conv!.conversationName).toBe('Sprint Review');
    expect(conv!.nameFixed).toBe(true);
    expect(conv!.summary).toBe('We reviewed the sprint.');
  });

  it('instance from findOne is not dirty', async () => {
    const { perspective } = createMockPerspective([
      {
        id: 'conv-1',
        conversationName: 'Name',
        nameFixed: false,
        summary: 'Summary',
      },
    ]);

    const conv = await Conversation.findOne(perspective as any);

    expect(conv!.isDirty()).toBe(false);
  });

  it('findOne → rename → save round-trip', async () => {
    const { perspective, executeActionCalls } = createMockPerspective([
      {
        id: 'conv-1',
        conversationName: 'Auto Generated Name',
        nameFixed: false,
        summary: 'Summary',
      },
    ]);

    const conv = await Conversation.findOne(perspective as any);
    conv!.conversationName = 'User Chosen Name';
    conv!.nameFixed = true;

    // After save, getData() calls modelQuery
    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'conv-1', conversationName: 'User Chosen Name', nameFixed: true }],
      totalCount: 1,
    });

    await conv!.save();

    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_name',
    );
    const fixedAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://name_is_fixed',
    );
    expect(nameAction).toBeDefined();
    expect(fixedAction).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// nameFixed guard (UI pattern from EditChannelNameModal)
// ---------------------------------------------------------------------------

describe('Conversation nameFixed guard', () => {
  it('auto-generated name can be overwritten by processNewExpressions (nameFixed=false)', () => {
    const { perspective } = createMockPerspective();
    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Auto Name',
      nameFixed: false,
    });

    // Simulate processNewExpressions updating name when not fixed
    if (!conv.nameFixed) {
      conv.conversationName = 'LLM Generated Name';
    }

    expect(conv.conversationName).toBe('LLM Generated Name');
  });

  it('user-fixed name is preserved when processNewExpressions runs (nameFixed=true)', () => {
    const { perspective } = createMockPerspective();
    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'My Custom Name',
      nameFixed: true,
    });

    // Simulate processNewExpressions checking nameFixed
    if (!conv.nameFixed) {
      conv.conversationName = 'LLM Generated Name';
    }

    expect(conv.conversationName).toBe('My Custom Name');
  });

  it('setting nameFixed=true prevents future auto-rename', () => {
    const { perspective } = createMockPerspective();
    const conv = hydrateConversation(perspective, 'conv-1', {
      conversationName: 'Auto Name',
      nameFixed: false,
    });

    // User renames and sets fixed
    conv.conversationName = 'User Chosen';
    conv.nameFixed = true;

    // Later, processNewExpressions tries to rename
    if (!conv.nameFixed) {
      conv.conversationName = 'Should Not See This';
    }

    expect(conv.conversationName).toBe('User Chosen');
    expect(conv.nameFixed).toBe(true);
  });
});
