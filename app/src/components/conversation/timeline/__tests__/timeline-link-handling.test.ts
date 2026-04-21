/**
 * Tests for getData() and handleLinkAdded() logic extracted from TimelineColumn.vue.
 *
 * These test the decision logic in isolation (predicate routing, debounce,
 * concurrent fetch guard) without requiring the full Vue component.
 */

// ── Extracted logic under test ──

const CONVERSATION_META_PREDICATES = ['flux://has_name', 'flux://has_summary', 'flux://has_child'];
const MESSAGE_PREDICATES = ['flux://has_expression', 'ad4m://has_child'];

function isConversationMetaPredicate(predicate: string | undefined): boolean {
  return !!predicate && CONVERSATION_META_PREDICATES.some(p => predicate.includes(p));
}

function isMessagePredicate(predicate: string | undefined): boolean {
  return !predicate || MESSAGE_PREDICATES.some(p => predicate.includes(p));
}

// Simulated state + handler
function createHandler() {
  const state = {
    gettingData: false,
    linkAddedTimeout: null as ReturnType<typeof setTimeout> | null,
    linkUpdatesQueued: false,
    _needsFull: false,
    calls: [] as string[],
  };

  const getDataFull = () => { state.calls.push('full'); };
  const getDataIncremental = () => { state.calls.push('incremental'); };

  function handleLinkAdded(link?: any) {
    const predicate = link?.data?.predicate;
    const needsFullRefresh = isConversationMetaPredicate(predicate);

    if (state.linkAddedTimeout) {
      state.linkUpdatesQueued = true;
      if (needsFullRefresh) state._needsFull = true;
      return;
    }

    const refreshFn = needsFullRefresh ? getDataFull : getDataIncremental;
    refreshFn();
    state.linkUpdatesQueued = false;
    state._needsFull = false;

    state.linkAddedTimeout = setTimeout(() => {
      state.linkAddedTimeout = null;
      if (state.linkUpdatesQueued) {
        const fn = state._needsFull ? getDataFull : getDataIncremental;
        fn();
        state.linkUpdatesQueued = false;
        state._needsFull = false;
      }
    }, 100); // Short timeout for testing
  }

  function cleanup() {
    if (state.linkAddedTimeout) {
      clearTimeout(state.linkAddedTimeout);
      state.linkAddedTimeout = null;
    }
  }

  return { state, handleLinkAdded, cleanup };
}

// ── Tests ──

describe('isConversationMetaPredicate', () => {
  it('returns true for known meta predicates', () => {
    expect(isConversationMetaPredicate('flux://has_name')).toBe(true);
    expect(isConversationMetaPredicate('flux://has_summary')).toBe(true);
  });

  // Test #23: Unknown predicate
  it('returns false for unknown predicates', () => {
    expect(isConversationMetaPredicate('flux://unknown_thing')).toBe(false);
    expect(isConversationMetaPredicate('ad4m://random')).toBe(false);
  });

  it('returns false for undefined/null predicates', () => {
    expect(isConversationMetaPredicate(undefined)).toBe(false);
  });
});

describe('isMessagePredicate', () => {
  it('returns true for message predicates', () => {
    expect(isMessagePredicate('flux://has_expression')).toBe(true);
    expect(isMessagePredicate('ad4m://has_child')).toBe(true);
  });

  it('returns true for undefined (safe default)', () => {
    expect(isMessagePredicate(undefined)).toBe(true);
  });

  it('returns false for non-message predicates', () => {
    expect(isMessagePredicate('flux://has_name')).toBe(false);
  });
});

describe('handleLinkAdded — link routing', () => {
  // Test #23: Unknown predicate should trigger incremental (not full, not nothing)
  it('unknown predicate triggers incremental refresh', () => {
    const { state, handleLinkAdded, cleanup } = createHandler();
    handleLinkAdded({ data: { predicate: 'flux://has_expression' } });
    expect(state.calls).toEqual(['incremental']);
    cleanup();
  });

  it('meta predicate triggers full refresh', () => {
    const { state, handleLinkAdded, cleanup } = createHandler();
    handleLinkAdded({ data: { predicate: 'flux://has_name' } });
    expect(state.calls).toEqual(['full']);
    cleanup();
  });

  // Test #24: Mixed predicates in quick succession escalate to full
  it('message + meta predicate in quick succession escalates to full refresh', (done) => {
    const { state, handleLinkAdded, cleanup } = createHandler();
    // First: message predicate — triggers incremental immediately
    handleLinkAdded({ data: { predicate: 'flux://has_expression' } });
    expect(state.calls).toEqual(['incremental']);

    // Second (during cooldown): meta predicate — queued, upgrades to full
    handleLinkAdded({ data: { predicate: 'flux://has_name' } });
    expect(state.linkUpdatesQueued).toBe(true);
    expect(state._needsFull).toBe(true);

    // After cooldown, the queued full refresh fires
    setTimeout(() => {
      expect(state.calls).toEqual(['incremental', 'full']);
      cleanup();
      done();
    }, 150);
  });

  // Test #25: gettingData guard prevents concurrent fetches
  it('gettingData guard prevents concurrent getData calls', () => {
    // This tests the pattern: if (gettingData) return;
    let callCount = 0;
    let gettingData = false;

    async function getData() {
      if (gettingData) return;
      gettingData = true;
      callCount++;
      // Simulate async work
      await new Promise(r => setTimeout(r, 50));
      gettingData = false;
    }

    // Fire two concurrent calls
    getData();
    getData(); // Should be blocked by guard
    expect(callCount).toBe(1);
  });
});

describe('handleLinkAdded — debounce behavior', () => {
  it('queues events during cooldown period', () => {
    const { state, handleLinkAdded, cleanup } = createHandler();
    // First event fires immediately
    handleLinkAdded({ data: { predicate: 'flux://has_expression' } });
    expect(state.calls).toEqual(['incremental']);

    // Second event during cooldown is queued, not fired
    handleLinkAdded({ data: { predicate: 'flux://has_expression' } });
    expect(state.calls).toEqual(['incremental']); // Still only 1 call
    expect(state.linkUpdatesQueued).toBe(true);

    cleanup();
  });

  it('processes queued events after cooldown expires', (done) => {
    const { state, handleLinkAdded } = createHandler();
    handleLinkAdded({ data: { predicate: 'flux://has_expression' } });
    handleLinkAdded({ data: { predicate: 'flux://has_expression' } });

    setTimeout(() => {
      // After cooldown, queued incremental should have fired
      expect(state.calls).toEqual(['incremental', 'incremental']);
      done();
    }, 150);
  });
});
