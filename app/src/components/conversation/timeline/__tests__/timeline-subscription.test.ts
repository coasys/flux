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

