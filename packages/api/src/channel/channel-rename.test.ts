/**
 * Channel/ChannelSummary rename and property update tests.
 *
 * Tests the Ad4mModel dirty-tracking and save pipeline for scalar property
 * changes on ChannelSummary instances (the lightweight model used in the UI).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelSummary } from './ChannelSummary';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a mock perspective that simulates the modelQuery endpoint.
 * Returns instances as serialised JSON matching what the Rust executor produces.
 */
function createMockPerspective(instances: any[] = []) {
  const executeActionCalls: any[][] = [];
  const createExpressionCalls: any[][] = [];

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
      createExpression: vi.fn(async (...args: any[]) => {
        createExpressionCalls.push(args);
        return `literal://${args[0]}`;
      }),
      createBatch: vi.fn().mockResolvedValue('batch-1'),
      commitBatch: vi.fn().mockResolvedValue(undefined),
      stringOrTemplateObjectToSubjectClassName: vi.fn().mockResolvedValue('Channel'),
      createSubject: vi.fn().mockResolvedValue(undefined),
      querySparql: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue({}),
    },
    executeActionCalls,
    createExpressionCalls,
  };
}

/**
 * Hydrate a ChannelSummary as if it came from `findOne()`.
 * Sets properties and calls the private `takeSnapshot()` to establish
 * the dirty-tracking baseline.
 */
function hydrateChannelSummary(
  perspective: any,
  id: string,
  props: { name?: string; description?: string; isConversation?: boolean; isPinned?: boolean },
): ChannelSummary {
  const instance = new ChannelSummary(perspective, id);
  if (props.name !== undefined) instance.name = props.name;
  if (props.description !== undefined) instance.description = props.description;
  if (props.isConversation !== undefined) instance.isConversation = props.isConversation;
  if (props.isPinned !== undefined) instance.isPinned = props.isPinned;

  // Simulate the snapshot that findOne/findAll takes after hydration
  (instance as any).takeSnapshot(null); // null = no relations (ChannelSummary has none)
  return instance;
}

// ---------------------------------------------------------------------------
// Dirty tracking after hydration
// ---------------------------------------------------------------------------

describe('ChannelSummary dirty tracking', () => {
  it('is not dirty immediately after hydration (snapshot taken)', () => {
    const { perspective } = createMockPerspective();
    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'General',
      description: 'Main channel',
      isConversation: false,
      isPinned: false,
    });

    expect(channel.isDirty()).toBe(false);
    expect(channel.changedFields()).toEqual([]);
  });

  it('marks name as dirty after modification', () => {
    const { perspective } = createMockPerspective();
    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'General',
      description: 'Main channel',
    });

    channel.name = 'Announcements';

    expect(channel.isDirty()).toBe(true);
    expect(channel.changedFields()).toContain('name');
    expect(channel.changedFields()).not.toContain('description');
  });

  it('marks description as dirty after modification', () => {
    const { perspective } = createMockPerspective();
    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'General',
      description: 'Main channel',
    });

    channel.description = 'Updated description';

    expect(channel.isDirty()).toBe(true);
    expect(channel.changedFields()).toContain('description');
    expect(channel.changedFields()).not.toContain('name');
  });

  it('tracks multiple changed fields', () => {
    const { perspective } = createMockPerspective();
    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'General',
      description: 'Main channel',
      isPinned: false,
    });

    channel.name = 'New Name';
    channel.description = 'New Description';
    channel.isPinned = true;

    const changed = channel.changedFields();
    expect(changed).toContain('name');
    expect(changed).toContain('description');
    expect(changed).toContain('isPinned');
  });

  it('is not dirty when value is set back to original', () => {
    const { perspective } = createMockPerspective();
    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'General',
    });

    channel.name = 'Something Else';
    expect(channel.isDirty()).toBe(true);

    channel.name = 'General';
    expect(channel.isDirty()).toBe(false);
    expect(channel.changedFields()).toEqual([]);
  });

  it('is dirty without snapshot (freshly constructed)', () => {
    const { perspective } = createMockPerspective();
    const channel = new ChannelSummary(perspective, 'channel-1');
    channel.name = 'Test';

    // No snapshot taken → always dirty
    expect(channel.isDirty()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generatePropertySetterAction (via save/innerUpdate)
// ---------------------------------------------------------------------------

describe('ChannelSummary property setter actions', () => {
  it('save() calls executeAction with setSingleTarget for name change', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    // After save, it calls getData() which calls modelQuery again
    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'channel-1', name: 'New Name', description: 'Desc' }],
      totalCount: 1,
    });

    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'Old Name',
      description: 'Desc',
    });

    channel.name = 'New Name';
    await channel.save();

    // Should have called executeAction with the setSingleTarget action
    expect(executeActionCalls.length).toBeGreaterThan(0);

    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_name',
    );
    expect(nameAction).toBeDefined();
    expect(nameAction![0][0].action).toBe('setSingleTarget');
    expect(nameAction![0][0].source).toBe('this');
    expect(nameAction![0][0].target).toBe('value');
    // The baseExpression should be the channel id
    expect(nameAction![1]).toBe('channel-1');
  });

  it('save() calls executeAction with correct predicate for description', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'channel-1', name: 'Name', description: 'New Desc' }],
      totalCount: 1,
    });

    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'Name',
      description: 'Old Desc',
    });

    channel.description = 'New Desc';
    await channel.save();

    const descAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_description',
    );
    expect(descAction).toBeDefined();
    expect(descAction![0][0].action).toBe('setSingleTarget');
  });

  it('save() does NOT call executeAction for unchanged properties', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'channel-1', name: 'New Name', description: 'Same Desc' }],
      totalCount: 1,
    });

    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'Old Name',
      description: 'Same Desc',
    });

    channel.name = 'New Name';
    await channel.save();

    // Should have a name action but NOT a description action
    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_name',
    );
    const descAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_description',
    );
    expect(nameAction).toBeDefined();
    expect(descAction).toBeUndefined();
  });

  it('save() handles multiple property changes in one call', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{
        id: 'channel-1',
        name: 'New Name',
        description: 'New Desc',
        isPinned: true,
      }],
      totalCount: 1,
    });

    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'Old Name',
      description: 'Old Desc',
      isPinned: false,
    });

    channel.name = 'New Name';
    channel.description = 'New Desc';
    channel.isPinned = true;
    await channel.save();

    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_name',
    );
    const descAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_description',
    );
    const pinnedAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://channel_is_pinned',
    );
    expect(nameAction).toBeDefined();
    expect(descAction).toBeDefined();
    expect(pinnedAction).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Empty/null value handling
// ---------------------------------------------------------------------------

describe('ChannelSummary empty value handling', () => {
  it('setProperty skips empty string values (no-op)', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    // After save getData() is called
    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'channel-1', name: '', description: 'Desc' }],
      totalCount: 1,
    });

    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'Original',
      description: 'Desc',
    });

    channel.name = '';
    await channel.save();

    // setProperty should NOT have been called for name (empty string is skipped)
    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_name',
    );
    expect(nameAction).toBeUndefined();
  });

  it('setProperty skips null values', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'channel-1', name: null, description: 'Desc' }],
      totalCount: 1,
    });

    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'Original',
      description: 'Desc',
    });

    (channel as any).name = null;
    await channel.save();

    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_name',
    );
    expect(nameAction).toBeUndefined();
  });

  it('setProperty skips undefined values', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'channel-1', name: undefined, description: 'Desc' }],
      totalCount: 1,
    });

    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'Original',
      description: 'Desc',
    });

    (channel as any).name = undefined;
    await channel.save();

    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_name',
    );
    expect(nameAction).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// save() with batchId
// ---------------------------------------------------------------------------

describe('ChannelSummary save with batchId', () => {
  it('passes batchId to executeAction when provided', async () => {
    const { perspective, executeActionCalls } = createMockPerspective();

    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'Old',
      description: 'Desc',
    });

    channel.name = 'New';
    await channel.save('batch-42');

    expect(executeActionCalls.length).toBeGreaterThan(0);
    // The batchId is the 4th argument to executeAction
    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_name',
    );
    expect(nameAction).toBeDefined();
    expect(nameAction![3]).toBe('batch-42');
  });

  it('does NOT call getData() when batchId is provided (batch not committed)', async () => {
    const { perspective } = createMockPerspective();

    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'Old',
      description: 'Desc',
    });

    channel.name = 'New';
    await channel.save('batch-42');

    // modelQuery should NOT have been called (getData skipped for batch saves)
    expect(perspective.modelQuery).not.toHaveBeenCalled();
  });

  it('takes a fresh snapshot after batch save for subsequent dirty tracking', async () => {
    const { perspective } = createMockPerspective();

    const channel = hydrateChannelSummary(perspective, 'channel-1', {
      name: 'Old',
      description: 'Desc',
    });

    channel.name = 'New';
    await channel.save('batch-42');

    // After batch save, snapshot should reflect the new value
    expect(channel.isDirty()).toBe(false);
    expect(channel.changedFields()).toEqual([]);
    expect(channel.name).toBe('New');
  });
});

// ---------------------------------------------------------------------------
// findOne integration (mocked modelQuery)
// ---------------------------------------------------------------------------

describe('ChannelSummary.findOne() hydration', () => {
  it('hydrates instance with correct properties from modelQuery', async () => {
    const { perspective } = createMockPerspective([
      {
        id: 'channel-1',
        name: 'General',
        description: 'The main channel',
        isConversation: false,
        isPinned: true,
      },
    ]);

    const channel = await ChannelSummary.findOne(perspective as any);

    expect(channel).not.toBeNull();
    expect(channel!.id).toBe('channel-1');
    expect(channel!.name).toBe('General');
    expect(channel!.description).toBe('The main channel');
    expect(channel!.isConversation).toBe(false);
    expect(channel!.isPinned).toBe(true);
  });

  it('instance from findOne is not dirty', async () => {
    const { perspective } = createMockPerspective([
      {
        id: 'channel-1',
        name: 'General',
        description: 'Desc',
        isConversation: false,
        isPinned: false,
      },
    ]);

    const channel = await ChannelSummary.findOne(perspective as any);

    expect(channel!.isDirty()).toBe(false);
    expect(channel!.changedFields()).toEqual([]);
  });

  it('instance from findOne becomes dirty after name change', async () => {
    const { perspective } = createMockPerspective([
      {
        id: 'channel-1',
        name: 'General',
        description: 'Desc',
        isConversation: false,
        isPinned: false,
      },
    ]);

    const channel = await ChannelSummary.findOne(perspective as any);
    channel!.name = 'Renamed Channel';

    expect(channel!.isDirty()).toBe(true);
    expect(channel!.changedFields()).toEqual(['name']);
  });

  it('findOne → modify → save round-trip', async () => {
    const { perspective, executeActionCalls } = createMockPerspective([
      {
        id: 'channel-1',
        name: 'General',
        description: 'Desc',
        isConversation: false,
        isPinned: false,
      },
    ]);

    const channel = await ChannelSummary.findOne(perspective as any);
    channel!.name = 'Renamed';

    // After save, getData() will call modelQuery again — set up the response
    perspective.modelQuery.mockResolvedValueOnce({
      instances: [{ id: 'channel-1', name: 'Renamed', description: 'Desc' }],
      totalCount: 1,
    });

    await channel!.save();

    const nameAction = executeActionCalls.find(
      (call) => call[0]?.[0]?.predicate === 'flux://has_channel_name',
    );
    expect(nameAction).toBeDefined();
    expect(nameAction![0][0].action).toBe('setSingleTarget');
  });

  it('returns null when no instances match', async () => {
    const { perspective } = createMockPerspective([]);

    const channel = await ChannelSummary.findOne(perspective as any);
    expect(channel).toBeNull();
  });
});
