/**
 * Tab Coordinator — Focus-follows-leader pattern
 *
 * Ensures only one browser tab per origin runs the signalling heartbeat and
 * WebRTC call logic.  Leadership silently follows user focus: whichever tab
 * the user is looking at becomes the leader.  A tab that is actively in a
 * call "pins" its leadership and refuses to yield until the call ends.
 *
 * Other tabs remain passive — they still receive signals so the UI stays
 * up-to-date, but they do NOT broadcast heartbeats or state.
 */
import { ref, readonly } from 'vue';

// ── Constants ────────────────────────────────────────────────────────────────
const CHANNEL_NAME = 'flux-tab-coordinator';
const LEADER_HEARTBEAT_INTERVAL = 5_000; // ms — leader pings all tabs
const LEADER_TIMEOUT = 15_000; // ms — assume leader is dead if no ping

// ── Message types ────────────────────────────────────────────────────────────
interface CoordinatorMessage {
  type: 'claim' | 'yield' | 'heartbeat' | 'call-pinned' | 'resign' | 'request-focus';
  tabId: string;
  timestamp: number;
  /** When type === 'call-pinned', the leader tells the claimer it can't yield */
  inCall?: boolean;
}

// ── Per-tab unique ID (survives soft reloads, not new tabs) ──────────────────
function getTabId(): string {
  let id = sessionStorage.getItem('flux-tab-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('flux-tab-id', id);
  }
  return id;
}

// ── Singleton ────────────────────────────────────────────────────────────────
// The coordinator must be shared across all composable consumers in the same
// tab, so we lazily initialise it once.

let _instance: ReturnType<typeof createTabCoordinator> | null = null;

export function useTabCoordinator() {
  if (!_instance) _instance = createTabCoordinator();
  return _instance;
}

// ── Factory ──────────────────────────────────────────────────────────────────
function createTabCoordinator() {
  const tabId = getTabId();
  const isLeader = ref(false);
  const otherTabInCall = ref(false); // true when another tab refused to yield because of an active call

  let channel: BroadcastChannel | null = null;
  let leaderHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let leaderTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let currentLeaderTabId: string | null = null;

  // Callbacks that consumers register (signalling start/stop)
  const onBecomeLeaderCbs = new Set<() => void>();
  const onLoseLeadershipCbs = new Set<() => void>();

  // ── Helpers ──────────────────────────────────────────────────────────────
  function post(msg: Omit<CoordinatorMessage, 'tabId' | 'timestamp'>) {
    channel?.postMessage({ ...msg, tabId, timestamp: Date.now() } as CoordinatorMessage);
  }

  function startLeaderHeartbeat() {
    stopLeaderHeartbeat();
    leaderHeartbeatTimer = setInterval(() => post({ type: 'heartbeat', inCall: _inCall }), LEADER_HEARTBEAT_INTERVAL);
  }

  function stopLeaderHeartbeat() {
    if (leaderHeartbeatTimer) {
      clearInterval(leaderHeartbeatTimer);
      leaderHeartbeatTimer = null;
    }
  }

  function resetLeaderTimeout() {
    if (leaderTimeoutTimer) clearTimeout(leaderTimeoutTimer);
    leaderTimeoutTimer = setTimeout(() => {
      // Leader appears dead — if we're visible, claim.
      // Clear stale otherTabInCall so claimLeadership isn't rejected by a
      // guard that no longer applies (the leader that was in a call is gone).
      if (document.visibilityState === 'visible') {
        otherTabInCall.value = false;
        claimLeadership();
      }
    }, LEADER_TIMEOUT);
  }

  // ── Core state transitions ───────────────────────────────────────────────
  /** Whether this tab is currently in a call (set externally by webrtcStore) */
  let _inCall = false;

  function setInCall(value: boolean) {
    _inCall = value;
  }

  function becomeLeader() {
    if (isLeader.value) return;
    isLeader.value = true;
    currentLeaderTabId = tabId;
    otherTabInCall.value = false;
    startLeaderHeartbeat();
    onBecomeLeaderCbs.forEach((cb) => {
      cb();
    });
  }

  function loseLeadership() {
    if (!isLeader.value) return;
    isLeader.value = false;
    stopLeaderHeartbeat();
    onLoseLeadershipCbs.forEach((cb) => {
      cb();
    });
  }

  /**
   * Attempt to claim leadership.  If `force` is true (used when joining a
   * call) we will claim even if another leader exists, unless that leader
   * is itself in a call.
   *
   * Returns a promise that resolves after a short grace period, giving
   * the current leader time to respond with 'call-pinned' if it refuses.
   */
  async function claimLeadership(force = false): Promise<boolean> {
    if (isLeader.value) return true; // already leader

    // If we know the current leader is in a call, don't try unless forced
    if (!force && otherTabInCall.value) return false;

    post({ type: 'claim', inCall: _inCall });
    // Optimistically become leader — if the existing leader refuses it will
    // send back a 'call-pinned' message and we'll revert.
    becomeLeader();

    // Wait briefly for a potential 'call-pinned' rejection from the current
    // leader. BroadcastChannel is async so we need this grace period.
    await new Promise((resolve) => setTimeout(resolve, 300));

    // If we lost leadership during the wait, the claim was rejected
    return isLeader.value;
  }

  function resign() {
    if (!isLeader.value) return;
    post({ type: 'resign' });
    loseLeadership();
  }

  // ── BroadcastChannel message handler ─────────────────────────────────────
  function handleMessage(event: MessageEvent<CoordinatorMessage>) {
    const msg = event.data;
    if (!msg || msg.tabId === tabId) return; // ignore own messages

    switch (msg.type) {
      case 'claim':
        // Another tab is claiming leadership
        if (isLeader.value) {
          if (_inCall) {
            // We're in a call — refuse to yield
            post({ type: 'call-pinned', inCall: true });
          } else {
            // Yield gracefully
            loseLeadership();
          }
        }
        // Track who the leader is now
        currentLeaderTabId = msg.tabId;
        resetLeaderTimeout();
        break;

      case 'call-pinned':
        // The existing leader refused our claim because it's in a call.
        // Always revert our optimistic claim — msg.tabId is guaranteed to
        // be a different tab (own messages are filtered at the top).
        if (isLeader.value) loseLeadership();
        otherTabInCall.value = true;
        currentLeaderTabId = msg.tabId;
        resetLeaderTimeout();
        break;

      case 'heartbeat':
        // The current leader is alive
        currentLeaderTabId = msg.tabId;
        if (isLeader.value && msg.tabId !== tabId) {
          // Two leaders detected — the other one wins if we're not in a call
          if (!_inCall) loseLeadership();
        }
        otherTabInCall.value = !!msg.inCall;
        resetLeaderTimeout();
        break;

      case 'resign':
        // The leader is leaving — if we're visible, claim
        if (msg.tabId === currentLeaderTabId) {
          currentLeaderTabId = null;
          if (document.visibilityState === 'visible') claimLeadership();
        }
        break;

      case 'yield':
        // Explicit yield — same as resign for us
        if (msg.tabId === currentLeaderTabId) {
          currentLeaderTabId = null;
          if (document.visibilityState === 'visible') claimLeadership();
        }
        break;

      case 'request-focus':
        // Another tab asked us (the leader) to surface — best effort
        if (isLeader.value) {
          try {
            window.focus();
          } catch {
            // Browsers may block this
          }
        }
        break;
    }
  }

  // ── Visibility / focus listeners ─────────────────────────────────────────
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Tab became visible — try to claim leadership
      claimLeadership();
    }
  }

  function handleFocus() {
    claimLeadership();
  }

  function handleBeforeUnload() {
    resign();
    // Synchronous channel post for unload
    try {
      channel?.postMessage({ type: 'resign', tabId, timestamp: Date.now() } as CoordinatorMessage);
    } catch {
      // Channel may already be closed
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────
  function init() {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = handleMessage;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // On startup: wait a short beat for any existing leader heartbeat.
    // If none arrives, claim leadership.
    leaderTimeoutTimer = setTimeout(() => {
      if (!isLeader.value && !currentLeaderTabId) {
        // No leader detected — we become leader
        becomeLeader();
        post({ type: 'claim', inCall: _inCall });
      }
    }, 1_000);

    // If we're already visible (most common for first tab), claim immediately
    // after a microtask so other tabs have a chance to respond.
    if (document.visibilityState === 'visible') {
      setTimeout(() => {
        if (!currentLeaderTabId) {
          becomeLeader();
          post({ type: 'claim', inCall: _inCall });
        }
      }, 100);
    }
  }

  function destroy() {
    resign();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    stopLeaderHeartbeat();
    if (leaderTimeoutTimer) clearTimeout(leaderTimeoutTimer);
    if (channel) {
      channel.onmessage = null;
      channel.close();
      channel = null;
    }
    _instance = null;
  }

  // Auto-initialise
  init();

  return {
    tabId,
    isLeader: readonly(isLeader),
    otherTabInCall: readonly(otherTabInCall),
    claimLeadership,
    resign,
    setInCall,
    /** Request the leader tab to surface itself (window.focus) */
    requestLeaderFocus: () => post({ type: 'request-focus' }),
    /** Subscribe to leadership gained. Returns an unsubscribe function. */
    onBecomeLeader: (cb: () => void) => {
      onBecomeLeaderCbs.add(cb);
      return () => {
        onBecomeLeaderCbs.delete(cb);
      };
    },
    /** Subscribe to leadership lost. Returns an unsubscribe function. */
    onLoseLeadership: (cb: () => void) => {
      onLoseLeadershipCbs.add(cb);
      return () => {
        onLoseLeadershipCbs.delete(cb);
      };
    },
    destroy,
  };
}
