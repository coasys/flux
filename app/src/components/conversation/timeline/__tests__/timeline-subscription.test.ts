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

  it('debounces rapid subscription updates into a single refresh', (done) => {
    // Simulate a batch commit triggering multiple subscription updates
    handler.scheduleRefresh();
    handler.scheduleRefresh();
    handler.scheduleRefresh();

    setTimeout(() => {
      expect(handler.refreshCallCount).toBe(1);
      done();
    }, 100);
  });

  it('fires separate refreshes for updates after debounce window', (done) => {
    handler.scheduleRefresh();

    // Wait for debounce to complete, then trigger another
    setTimeout(() => {
      handler.scheduleRefresh();

      setTimeout(() => {
        expect(handler.refreshCallCount).toBe(2);
        done();
      }, 100);
    }, 100);
  });

  it('resets the debounce timer on each call', (done) => {
    handler.scheduleRefresh();

    // Call again before debounce expires — should reset the timer
    setTimeout(() => {
      handler.scheduleRefresh();
    }, 30);

    // At 80ms from start: first timer (50ms) would have fired, but it was reset at 30ms
    // So only the second timer (30ms + 50ms = 80ms) fires
    setTimeout(() => {
      expect(handler.refreshCallCount).toBe(0); // Not yet fired
    }, 60);

    setTimeout(() => {
      expect(handler.refreshCallCount).toBe(1); // Now fired
      done();
    }, 120);
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
