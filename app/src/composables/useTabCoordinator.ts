/**
 * Tab Coordinator — Focus-follows-leader pattern
 *
 * Elects a single "leader" tab per origin that runs the signalling heartbeat
 * for general presence (which channel you're viewing, online status, …).
 * Leadership silently follows user focus: whichever tab the user is looking at
 * becomes the leader.  Other tabs stay passive — they still receive signals so
 * the UI stays up-to-date, but they don't broadcast general-presence heartbeats.
 *
 * Calls are deliberately NOT tied to leadership.  A single agent can be in a
 * call from multiple tabs/devices simultaneously; each in-call tab broadcasts
 * its own session presence (see useSignallingService) regardless of who the
 * leader is, so switching tabs never drops a call.  `tabId` doubles as the
 * per-session id used to key call presence and WebRTC peers.
 */
import { ref, readonly } from 'vue';

// ── Constants ────────────────────────────────────────────────────────────────
const CHANNEL_NAME = 'flux-tab-coordinator';
const LEADER_HEARTBEAT_INTERVAL = 5_000; // ms — leader pings all tabs
const LEADER_TIMEOUT = 15_000; // ms — assume leader is dead if no ping

// ── Message types ────────────────────────────────────────────────────────────
interface CoordinatorMessage {
  type: 'claim' | 'yield' | 'heartbeat' | 'resign' | 'request-focus';
  tabId: string;
  timestamp: number;
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
    leaderHeartbeatTimer = setInterval(() => post({ type: 'heartbeat' }), LEADER_HEARTBEAT_INTERVAL);
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
      if (document.visibilityState === 'visible') claimLeadership();
    }, LEADER_TIMEOUT);
  }

  // ── Core state transitions ───────────────────────────────────────────────
  function becomeLeader() {
    if (isLeader.value) return;
    isLeader.value = true;
    currentLeaderTabId = tabId;
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
   * Attempt to claim leadership.  Leadership follows focus, so claiming simply
   * announces this tab and optimistically takes over; the current leader yields
   * gracefully when it sees the claim.  Resolves after a short grace period.
   */
  async function claimLeadership(): Promise<boolean> {
    if (isLeader.value) return true; // already leader

    post({ type: 'claim' });
    becomeLeader();

    // BroadcastChannel is async — give other tabs a beat to react.
    await new Promise((resolve) => setTimeout(resolve, 300));

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
        // Another tab is claiming leadership — yield gracefully.
        if (isLeader.value) loseLeadership();
        currentLeaderTabId = msg.tabId;
        resetLeaderTimeout();
        break;

      case 'heartbeat':
        // The current leader is alive
        currentLeaderTabId = msg.tabId;
        // Two leaders detected — the other one wins (deterministic: the most
        // recent claimer/heartbeat takes over) so we converge on a single leader.
        if (isLeader.value && msg.tabId !== tabId) loseLeadership();
        resetLeaderTimeout();
        break;

      case 'resign':
      case 'yield':
        // The leader is leaving — if we're visible, claim
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
        post({ type: 'claim' });
      }
    }, 1_000);

    // If we're already visible (most common for first tab), claim immediately
    // after a microtask so other tabs have a chance to respond.
    if (document.visibilityState === 'visible') {
      setTimeout(() => {
        if (!currentLeaderTabId) {
          becomeLeader();
          post({ type: 'claim' });
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
    /** Stable per-tab id — also used as the call/presence session id. */
    tabId,
    isLeader: readonly(isLeader),
    claimLeadership,
    resign,
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
