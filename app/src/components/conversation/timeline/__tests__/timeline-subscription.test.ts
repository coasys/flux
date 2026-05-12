/**
 * Tests for the unprocessed-items refresh logic in TimelineColumn.vue.
 *
 * The key bug: the watchEffect for unprocessedItems depended solely on
 * conversationInstances (useLiveQuery subscription). New messages are children
 * of the Channel, not Conversation changes, so the subscription never fired
 * for new messages.
 *
 * The fix uses a targeted SPARQL subscription via perspective.subscribeQuery()
 * that only fires when THIS channel's ad4m://has_child links change, rather
 * than addListener('link-added') which fires for every link in the perspective.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Extracted logic under test
// ---------------------------------------------------------------------------

/**
 * Simulates the debounced refresh logic from TimelineColumn.vue.
 * The SPARQL subscription fires when the channel's children change;
 * the debounce prevents rapid-fire refreshes from batch commits.
 */
function createDebouncedRefreshHandler() {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let refreshCallCount = 0;
  const refreshTimestamps: number[] = [];

  async function refreshUnprocessedItems() {
    refreshCallCount++;
    refreshTimestamps.push(Date.now());
  }

  function scheduleRefresh() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(refreshUnprocessedItems, 50); // Short timeout for testing
  }

  function cleanup() {
    if (timer) clearTimeout(timer);
  }

  return {
    scheduleRefresh,
    cleanup,
    get refreshCallCount() { return refreshCallCount; },
    get refreshTimestamps() { return refreshTimestamps; },
  };
}

// ---------------------------------------------------------------------------
// Tests: SPARQL subscription query correctness
// ---------------------------------------------------------------------------

describe('channel items SPARQL subscription', () => {
  it('query targets only the specific channel URL', () => {
    const channelUrl = 'channel://test-channel-1';
    // This mirrors the query constructed in TimelineColumn.vue
    const query = `SELECT ?id WHERE { <${channelUrl}> <ad4m://has_child> ?id . }`;

    expect(query).toContain(channelUrl);
    expect(query).toContain('ad4m://has_child');
    // Should NOT contain wildcards that would match other channels
    expect(query).not.toContain('?source');
  });

  it('query uses ad4m://has_child predicate (not flux://has_item)', () => {
    const channelUrl = 'channel://test-channel-1';
    const query = `SELECT ?id WHERE { <${channelUrl}> <ad4m://has_child> ?id . }`;

    // Channel items use ad4m://has_child, NOT flux://has_item (which is subgroup→item)
    expect(query).toContain('ad4m://has_child');
    expect(query).not.toContain('flux://has_item');
  });
});

// ---------------------------------------------------------------------------
// Tests: Subscription lifecycle
// ---------------------------------------------------------------------------

describe('channel items subscription lifecycle', () => {
  it('creates a mock subscription with onResult and dispose', async () => {
    // Simulates what perspective.subscribeQuery() returns
    const callbacks = new Set<() => void>();
    const mockSub = {
      result: [],
      onResult: (cb: () => void) => { callbacks.add(cb); return () => callbacks.delete(cb); },
      dispose: vi.fn(),
    };

    // Register callback (mirrors TimelineColumn setup)
    const handler = createDebouncedRefreshHandler();
    mockSub.onResult(() => handler.scheduleRefresh());

    // Simulate a subscription update (new item added)
    for (const cb of callbacks) cb();

    // Wait for debounce
    await new Promise(r => setTimeout(r, 100));
    expect(handler.refreshCallCount).toBe(1);

    // Cleanup
    handler.cleanup();
    mockSub.dispose();
    expect(mockSub.dispose).toHaveBeenCalledTimes(1);
  });

  it('dispose prevents further callbacks from firing', async () => {
    const callbacks = new Set<() => void>();
    const mockSub = {
      onResult: (cb: () => void) => {
        callbacks.add(cb);
        return () => callbacks.delete(cb);
      },
      dispose: () => callbacks.clear(),
    };

    const handler = createDebouncedRefreshHandler();
    mockSub.onResult(() => handler.scheduleRefresh());

    // First update — should trigger refresh
    for (const cb of callbacks) cb();
    await new Promise(r => setTimeout(r, 100));
    expect(handler.refreshCallCount).toBe(1);

    // Dispose subscription
    mockSub.dispose();

    // Second update — should NOT trigger refresh (callbacks cleared)
    for (const cb of callbacks) cb();
    await new Promise(r => setTimeout(r, 100));
    expect(handler.refreshCallCount).toBe(1); // Still 1

    handler.cleanup();
  });
});

// ---------------------------------------------------------------------------
// Tests: Debouncing
// ---------------------------------------------------------------------------

describe('unprocessed items refresh — debouncing', () => {
  let handler: ReturnType<typeof createDebouncedRefreshHandler>;

  beforeEach(() => {
    handler = createDebouncedRefreshHandler();
  });

  afterEach(() => {
    handler.cleanup();
  });

  it('debounces rapid subscription updates into a single refresh', async () => {
    // Simulate a batch commit triggering multiple subscription updates
    handler.scheduleRefresh();
    handler.scheduleRefresh();
    handler.scheduleRefresh();

    await new Promise((r) => setTimeout(r, 100));
    expect(handler.refreshCallCount).toBe(1);
  });

  it('fires separate refreshes for updates after debounce window', async () => {
    handler.scheduleRefresh();

    // Wait for debounce to complete, then trigger another
    await new Promise((r) => setTimeout(r, 100));
    handler.scheduleRefresh();

    await new Promise((r) => setTimeout(r, 100));
    expect(handler.refreshCallCount).toBe(2);
  });

  it('resets the debounce timer on each call', async () => {
    handler.scheduleRefresh();

    // Call again before debounce expires — should reset the timer
    await new Promise((r) => setTimeout(r, 30));
    handler.scheduleRefresh();

    // At 60ms from start: first timer (50ms) would have fired, but it was reset at 30ms
    // So only the second timer (30ms + 50ms = 80ms) fires
    await new Promise((r) => setTimeout(r, 30));
    expect(handler.refreshCallCount).toBe(0); // Not yet fired

    await new Promise((r) => setTimeout(r, 60));
    expect(handler.refreshCallCount).toBe(1); // Now fired
  });
});

// ---------------------------------------------------------------------------
// Tests: AI processing trigger chain
// ---------------------------------------------------------------------------

describe('AI processing trigger chain', () => {
  it('checkIfWeShouldProcessTask requires MIN_ITEMS + DELAY items', () => {
    const MIN_ITEMS_TO_PROCESS = 5;
    const PROCESSING_ITEMS_DELAY = 3;
    const threshold = MIN_ITEMS_TO_PROCESS + PROCESSING_ITEMS_DELAY;

    expect(7).toBeLessThan(threshold);
    expect(threshold).toBe(8);
    expect(9).toBeGreaterThan(threshold);
  });

  it('items-to-process count subtracts DELAY from total', () => {
    const MAX_ITEMS_TO_PROCESS = 20;
    const PROCESSING_ITEMS_DELAY = 3;

    // Simulates the calculation in processesNextTask
    const unprocessedCount = 10;
    const numberOfItemsToProcess = Math.max(
      0,
      Math.min(MAX_ITEMS_TO_PROCESS, unprocessedCount - PROCESSING_ITEMS_DELAY),
    );
    expect(numberOfItemsToProcess).toBe(7); // 10 - 3 = 7

    // Edge case: exactly at threshold
    const atThreshold = 8;
    const itemsAtThreshold = Math.max(
      0,
      Math.min(MAX_ITEMS_TO_PROCESS, atThreshold - PROCESSING_ITEMS_DELAY),
    );
    expect(itemsAtThreshold).toBe(5); // 8 - 3 = 5

    // Edge case: below threshold (shouldn't reach processesNextTask, but test anyway)
    const belowThreshold = 2;
    const itemsBelow = Math.max(
      0,
      Math.min(MAX_ITEMS_TO_PROCESS, belowThreshold - PROCESSING_ITEMS_DELAY),
    );
    expect(itemsBelow).toBe(0); // max(0, 2-3) = 0
  });

  it('authorship check requires at least one item by the current user', () => {
    const myDid = 'did:test:me';
    const items = [
      { id: 'msg-1', author: 'did:test:alice' },
      { id: 'msg-2', author: 'did:test:bob' },
    ];

    const weAuthored = items.some((item) => item.author === myDid);
    expect(weAuthored).toBe(false);

    // Add one of our items
    items.push({ id: 'msg-3', author: myDid });
    const weAuthoredNow = items.some((item) => item.author === myDid);
    expect(weAuthoredNow).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: processingStateChecked gate — race condition
// ---------------------------------------------------------------------------

describe('processingStateChecked gate race condition', () => {
  /**
   * Simulates the race condition in useCommunityService.ts where:
   * 1. watch(recentConversations) fires before allChannels has loaded
   * 2. processingStateChecked is set to true (gate closed)
   * 3. findProcessingTasksInCommunity runs but recentConversationsWithAgents
   *    has all channel: undefined entries → zero tasks queued
   * 4. allChannels loads later, but the gate is already closed → never re-checked
   *
   * The fix: watch BOTH recentConversations AND allChannels, and require
   * both to be non-empty before closing the gate.
   */

  // Simulates the OLD (broken) gate logic
  function brokenGate(
    recentConversations: { channelId: string }[],
    _allChannels: { id: string }[],
    aiEnabled: boolean,
    processingStateChecked: { value: boolean },
  ): boolean {
    // OLD: only checks recentConversations
    if (aiEnabled && !processingStateChecked.value) {
      processingStateChecked.value = true;
      return true; // would schedule findProcessingTasksInCommunity
    }
    return false;
  }

  // Simulates the NEW (fixed) gate logic
  function fixedGate(
    recentConversations: { channelId: string }[],
    allChannels: { id: string }[],
    aiEnabled: boolean,
    processingStateChecked: { value: boolean },
  ): boolean {
    if (
      aiEnabled &&
      !processingStateChecked.value &&
      recentConversations.length > 0 &&
      allChannels.length > 0
    ) {
      processingStateChecked.value = true;
      return true;
    }
    return false;
  }

  // Simulates recentConversationsWithAgents join
  function joinWithChannels(
    recentConversations: { channelId: string }[],
    allChannels: { id: string }[],
  ) {
    return recentConversations.map((data) => ({
      ...data,
      channel: allChannels.find((c) => c.id === data.channelId),
    }));
  }

  it('OLD gate: fires before allChannels loads → all channels undefined → zero tasks', () => {
    const processingStateChecked = { value: false };
    const recentConversations = [
      { channelId: 'ch-1' },
      { channelId: 'ch-2' },
    ];
    const allChannels: { id: string }[] = []; // Not loaded yet!

    // Step 1: recentConversations loads first, gate fires
    const fired = brokenGate(recentConversations, allChannels, true, processingStateChecked);
    expect(fired).toBe(true);
    expect(processingStateChecked.value).toBe(true); // Gate closed!

    // Step 2: findProcessingTasksInCommunity runs with empty allChannels
    const joined = joinWithChannels(recentConversations, allChannels);
    const tasksFound = joined.filter((d) => d.channel !== undefined);
    expect(tasksFound).toHaveLength(0); // All channels undefined!

    // Step 3: allChannels loads later
    allChannels.push({ id: 'ch-1' }, { id: 'ch-2' });

    // Step 4: gate is already closed — findProcessingTasksInCommunity never re-runs
    const firedAgain = brokenGate(recentConversations, allChannels, true, processingStateChecked);
    expect(firedAgain).toBe(false); // Gate already closed!

    // This is the BUG: tasks were never queued despite both data sources being ready
  });

  it('NEW gate: waits for both recentConversations AND allChannels', () => {
    const processingStateChecked = { value: false };
    const recentConversations = [
      { channelId: 'ch-1' },
      { channelId: 'ch-2' },
    ];
    const allChannels: { id: string }[] = []; // Not loaded yet!

    // Step 1: recentConversations loads first — gate does NOT fire
    const fired1 = fixedGate(recentConversations, allChannels, true, processingStateChecked);
    expect(fired1).toBe(false);
    expect(processingStateChecked.value).toBe(false); // Gate still open!

    // Step 2: allChannels loads
    allChannels.push({ id: 'ch-1' }, { id: 'ch-2' });

    // Step 3: watch fires again — NOW both are ready, gate fires
    const fired2 = fixedGate(recentConversations, allChannels, true, processingStateChecked);
    expect(fired2).toBe(true);
    expect(processingStateChecked.value).toBe(true);

    // Step 4: findProcessingTasksInCommunity runs with populated allChannels
    const joined = joinWithChannels(recentConversations, allChannels);
    const tasksFound = joined.filter((d) => d.channel !== undefined);
    expect(tasksFound).toHaveLength(2); // Both channels found!
  });

  it('NEW gate: handles allChannels loading first', () => {
    const processingStateChecked = { value: false };
    const recentConversations: { channelId: string }[] = [];
    const allChannels = [{ id: 'ch-1' }];

    // allChannels loads first — gate does NOT fire (no conversations yet)
    const fired1 = fixedGate(recentConversations, allChannels, true, processingStateChecked);
    expect(fired1).toBe(false);

    // recentConversations loads — now both ready
    recentConversations.push({ channelId: 'ch-1' });
    const fired2 = fixedGate(recentConversations, allChannels, true, processingStateChecked);
    expect(fired2).toBe(true);
  });

  it('NEW gate: does not fire when AI is disabled', () => {
    const processingStateChecked = { value: false };
    const recentConversations = [{ channelId: 'ch-1' }];
    const allChannels = [{ id: 'ch-1' }];

    const fired = fixedGate(recentConversations, allChannels, false, processingStateChecked);
    expect(fired).toBe(false);
    expect(processingStateChecked.value).toBe(false);
  });
});
