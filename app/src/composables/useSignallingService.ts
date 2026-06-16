import { useAiStore, useAppStore, useMediaDevicesStore, useRouteMemoryStore, useWebrtcStore } from '@/stores';
import { stripChannelPrefix } from '@/utils/routeUtils';
import { getCachedAgentProfile } from '@/utils/userProfileCache';
import { Link, NeighbourhoodProxy, PerspectiveExpression } from '@coasys/ad4m';
import { AgentData, AgentState, AgentStatus, ProcessingState, SignallingService } from '@coasys/flux-types';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useTabCoordinator } from './useTabCoordinator';
import { dedupeByDid, sessionKey } from '@/utils/callSessions';

export const HEARTBEAT_INTERVAL = 5000; // 5 seconds between heartbeats
const CLEANUP_INTERVAL = 10000; // 10 seconds between evaluations
const ASLEEP_THRESHOLD = 30000; // 30 seconds before "asleep"
const MAX_AGE = 60000; // 60 seconds before "offline"
const NEW_STATE = 'agent/new-state';

export function useSignallingService(neighbourhood: NeighbourhoodProxy): SignallingService {
  const tabCoordinator = useTabCoordinator();
  const appStore = useAppStore();
  const webrtcStore = useWebrtcStore();
  const mediaDevicesStore = useMediaDevicesStore();
  const routeMemoryStore = useRouteMemoryStore();
  const aiStore = useAiStore();

  const { me } = storeToRefs(appStore);
  const { inCall, callRoute, myAgentStatus } = storeToRefs(webrtcStore);
  const { mediaSettings } = storeToRefs(mediaDevicesStore);
  const { currentRoute } = storeToRefs(routeMemoryStore);
  const { aiEnabled } = storeToRefs(aiStore);

  // This tab's stable session id (shared with the tab coordinator) — presence
  // and WebRTC peers are keyed by `did::sessionId` so one agent can be present
  // from multiple tabs/devices at once.
  const mySessionId = tabCoordinator.tabId;
  const mySessionKey = computed(() => sessionKey(me.value.did, mySessionId));

  const signalling = ref(false);
  const myState = ref<AgentState>({
    currentRoute: currentRoute.value,
    status: myAgentStatus.value,
    callRoute: callRoute.value,
    mediaSettings: mediaSettings.value,
    aiEnabled: aiEnabled.value,
    inCall: false,
    processing: null,
    lastUpdate: Date.now(),
    did: me.value.did,
    sessionId: mySessionId,
  });

  const sampleAgents = {
    // 1: {
    //   aiEnabled: true,
    //   callRoute: {
    //     communityId: "neighbourhood://QmzSYwdcev24njoTCBnFoxmvRyae3ugsbDoy8qFKjvdBCSPPVtJ",
    //     channelId: "tussatdheecysoqqjbtjjswb",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "neighbourhood://QmzSYwdcev24njoTCBnFoxmvRyae3ugsbDoy8qFKjvdBCSPPVtJ",
    //     channelId: "tussatdheecysoqqjbtjjswb",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   inCall: true,
    //   lastUpdate: 1748628324292,
    //   mediaSettings: {
    //     audioEnabled: true,
    //     videoEnabled: false,
    //     screenShareEnabled: false,
    //   },
    //   processing: null,
    //   status: "active",
    // } as AgentState,
    // 2: {
    //   aiEnabled: true,
    //   callRoute: {
    //     communityId: "neighbourhood://QmzSYwdcev24njoTCBnFoxmvRyae3ugsbDoy8qFKjvdBCSPPVtJ",
    //     channelId: "tussatdheecysoqqjbtjjswb",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "neighbourhood://QmzSYwdcev24njoTCBnFoxmvRyae3ugsbDoy8qFKjvdBCSPPVtJ",
    //     channelId: "tussatdheecysoqqjbtjjswb",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   inCall: true,
    //   lastUpdate: 1748628324292,
    //   mediaSettings: {
    //     audioEnabled: true,
    //     videoEnabled: false,
    //     screenShareEnabled: false,
    //   },
    //   processing: null,
    //   status: "active",
    // } as AgentState,
    // 3: {
    //   aiEnabled: true,
    //   callRoute: {
    //     communityId: "eac01428-0bc7-4589-ba97-02bdebe93103",
    //     channelId: "literal:string:qochwldaaabrdsvfzmnmvqjd",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "eac01428-0bc7-4589-ba97-02bdebe93103",
    //     channelId: "literal:string:qochwldaaabrdsvfzmnmvqjd",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   inCall: true,
    //   lastUpdate: 1748628324292,
    //   mediaSettings: {
    //     audioEnabled: true,
    //     videoEnabled: false,
    //     screenShareEnabled: false,
    //   },
    //   processing: null,
    //   status: "active",
    // } as AgentState,
    // 4: {
    //   aiEnabled: true,
    //   callRoute: {
    //     communityId: "eac01428-0bc7-4589-ba97-02bdebe93103",
    //     channelId: "literal:string:qochwldaaabrdsvfzmnmvqjd",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "eac01428-0bc7-4589-ba97-02bdebe93103",
    //     channelId: "literal:string:qochwldaaabrdsvfzmnmvqjd",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   inCall: true,
    //   lastUpdate: 1748628324292,
    //   mediaSettings: {
    //     audioEnabled: true,
    //     videoEnabled: false,
    //     screenShareEnabled: false,
    //   },
    //   processing: null,
    //   status: "active",
    // } as AgentState,
    // 5: {
    //   aiEnabled: true,
    //   callRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal:string:ppfcssybewchueydyctoqkht",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal:string:ppfcssybewchueydyctoqkht",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   inCall: true,
    //   lastUpdate: 1748628324292,
    //   mediaSettings: {
    //     audioEnabled: true,
    //     videoEnabled: false,
    //     screenShareEnabled: false,
    //   },
    //   processing: null,
    //   status: "active",
    // } as AgentState,
    // 6: {
    //   aiEnabled: true,
    //   callRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal:string:ppfcssybewchueydyctoqkht",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal:string:ppfcssybewchueydyctoqkht",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   inCall: true,
    //   lastUpdate: 1748628324292,
    //   mediaSettings: {
    //     audioEnabled: true,
    //     videoEnabled: false,
    //     screenShareEnabled: false,
    //   },
    //   processing: null,
    //   status: "active",
    // } as AgentState,
  };

  let heartbeatTimeout: NodeJS.Timeout | null = null;
  let cleanupInterval: NodeJS.Timeout | null = null;

  const agents = ref<Record<string, AgentState>>(sampleAgents);
  const agentsWithProfiles = ref<AgentData[]>([]);
  const signalHandlers = ref<Array<(signal: PerspectiveExpression) => void>>([]);

  function addSignalHandler(handler: (signal: PerspectiveExpression) => void): void {
    signalHandlers.value.push(handler);
  }

  function removeSignalHandler(handler: (signal: PerspectiveExpression) => void): void {
    const index = signalHandlers.value.indexOf(handler);
    if (index !== -1) signalHandlers.value.splice(index, 1);
  }

  function sendSignal(link: Link): void {
    neighbourhood.sendBroadcastU({ links: [link] }).catch((error) => console.error('Error sending signal:', error));
  }

  function onSignal(signal: PerspectiveExpression): void {
    const link = signal.data.links[0];
    if (!link) return;

    const { author, data } = link;
    const { source, predicate, target } = data;

    if (predicate === NEW_STATE && link.author !== me.value.did) {
      // If this is their first broadcast, immediately broadcast my state so they dont have to wait for my next heartbeat
      if (target === 'first-broadcast') broadcastState();

      try {
        // Try to parse the agent's state and add it to the store
        const agentState = JSON.parse(source);
        if (typeof agentState === 'object' && agentState !== null) {
          // Key by session so a single agent present from multiple tabs/devices
          // gets one entry per session. `author` is the authoritative DID; the
          // sessionId travels in the payload (defaults keep older clients working).
          const senderSessionId = typeof agentState.sessionId === 'string' ? agentState.sessionId : author;
          const key = sessionKey(author, senderSessionId);
          agents.value[key] = {
            ...agents.value[key],
            ...agentState,
            did: author,
            sessionId: senderSessionId,
            lastUpdate: Date.now(),
          };
        }
      } catch (error) {
        console.error('Error parsing agent state:', error);
        const key = sessionKey(author, author);
        agents.value[key] = { ...agents.value[key], did: author, status: 'unknown', lastUpdate: Date.now() };
      }
    }

    // Forward signals to added signal handlers if present (used in the webrtc store)
    signalHandlers.value.forEach((handler) => handler(signal));
  }

  function broadcastState(target = ''): void {
    if (!signalling.value) return;
    // The leader tab broadcasts general presence (deduping idle tabs), and any
    // in-call tab broadcasts its own session presence so a call can run from
    // multiple tabs/devices independently of which tab is the leader.
    if (!tabCoordinator.isLeader.value && !inCall.value) return;

    // Broadcast my state to the neighbourhood
    const newState = { source: JSON.stringify(myState.value), predicate: NEW_STATE, target };
    neighbourhood
      .sendBroadcastU({ links: [newState] })
      .catch((error) => console.error('Error sending broadcast:', error));
  }

  // TODO: better distinguish between manually set agent status and signalling health
  function evaluateAgents(): void {
    const now = Date.now();
    Object.keys(agents.value).forEach((key) => {
      // Skip my own session
      if (key === mySessionKey.value) return;

      // Mark agents as asleep or offline if their last update is older than the HEARTBEAT_INTERVAL
      const agent = agents.value[key];
      const timeSinceLastUpdate = now - agent.lastUpdate;

      // Only evaluate if needed - don't change active to active
      if (timeSinceLastUpdate <= ASLEEP_THRESHOLD && agent.status === 'active') return;

      // Determine status based on time since last update
      let newStatus: AgentStatus;
      if (timeSinceLastUpdate <= ASLEEP_THRESHOLD) newStatus = 'active';
      else if (timeSinceLastUpdate < MAX_AGE) newStatus = 'asleep';
      else newStatus = 'offline';

      // Only update if status changed
      if (newStatus !== agent.status) agents.value[key] = { ...agent, status: newStatus };
    });
  }

  function scheduleNextHeartbeat(delay: number): void {
    // Clear existing timer if present
    if (heartbeatTimeout) {
      clearTimeout(heartbeatTimeout);
      heartbeatTimeout = null;
    }

    // Schedule next heartbeat
    heartbeatTimeout = setTimeout(() => {
      // If other broadcasts occured during the interval, delay the heartbeat until a full HEARTBEAT_INTERVAL has passed without updates
      const timeSinceLastUpdate = Date.now() - myState.value.lastUpdate;
      const buffer = 1000; // Used to avoid rescheduling if the time until the next heartbeat is small (less than the buffer)
      if (timeSinceLastUpdate + buffer < HEARTBEAT_INTERVAL)
        scheduleNextHeartbeat(HEARTBEAT_INTERVAL - timeSinceLastUpdate);
      else {
        // Broadcast my state to the neighbourhood and schedule the next heartbeat
        myState.value = { ...myState.value, did: me.value.did, lastUpdate: Date.now() };
        agents.value[mySessionKey.value] = myState.value;
        broadcastState();
        scheduleNextHeartbeat(HEARTBEAT_INTERVAL);
      }
    }, delay);
  }

  // ── Leader-only broadcasting ──────────────────────────────────────────────
  // These start/stop the heartbeat + cleanup timers that only the leader should run.
  function startBroadcasting(): void {
    if (!signalling.value) return;
    broadcastState('first-broadcast');
    scheduleNextHeartbeat(HEARTBEAT_INTERVAL);
    if (!cleanupInterval) cleanupInterval = setInterval(evaluateAgents, CLEANUP_INTERVAL);
  }

  function stopBroadcasting(): void {
    if (heartbeatTimeout) {
      clearTimeout(heartbeatTimeout);
      heartbeatTimeout = null;
    }
    // Keep the cleanup interval running — follower tabs still evaluate peer staleness
  }

  // Unsubscribe handles for leadership callbacks — stored at composable scope
  // so stopSignalling can clean up and startSignalling can re-subscribe.
  let unsubBecomeLeader: (() => void) | null = null;
  let unsubLoseLeadership: (() => void) | null = null;

  /** (Re-)subscribe to tab-coordinator leadership events. */
  function subscribeLeadership(): void {
    // Avoid double-subscribe: tear down any existing subscriptions first.
    if (unsubBecomeLeader) unsubBecomeLeader();
    if (unsubLoseLeadership) unsubLoseLeadership();

    unsubBecomeLeader = tabCoordinator.onBecomeLeader(() => {
      if (signalling.value) startBroadcasting();
    });
    unsubLoseLeadership = tabCoordinator.onLoseLeadership(() => {
      // Keep broadcasting while in a call even after losing leadership — an
      // in-call tab owns its own session presence regardless of the leader.
      if (!inCall.value) stopBroadcasting();
    });
  }

  function startSignalling(): void {
    if (signalling.value) stopSignalling();
    signalling.value = true;

    // Add my agent state to the agents map (keyed by my session)
    myState.value = { ...myState.value, did: me.value.did };
    agents.value[mySessionKey.value] = myState.value;

    // All tabs listen for signals so the UI stays up-to-date
    neighbourhood.addSignalHandler(onSignal);

    // Start the cleanup interval on all tabs (evaluates agent staleness)
    cleanupInterval = setInterval(evaluateAgents, CLEANUP_INTERVAL);

    // Subscribe (or re-subscribe) to leadership changes
    subscribeLeadership();

    // The leader broadcasts general presence; an in-call tab broadcasts its own
    // session presence even when it isn't the leader.
    if (tabCoordinator.isLeader.value || inCall.value) startBroadcasting();
  }

  function stopSignalling(): void {
    // Remove the signal handler
    neighbourhood.removeSignalHandler(onSignal);

    // Unsubscribe from tab coordinator to avoid leaking closures
    if (unsubBecomeLeader) {
      unsubBecomeLeader();
      unsubBecomeLeader = null;
    }
    if (unsubLoseLeadership) {
      unsubLoseLeadership();
      unsubLoseLeadership = null;
    }

    // Clear the intervals
    stopBroadcasting();
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }

    // Mark signaling as inactive to allow future restarts
    signalling.value = false;
  }

  function getAgentState(did: string): AgentState | undefined {
    // Presence is keyed by session; return the most recently updated session
    // for the requested agent.
    return Object.values(agents.value)
      .filter((agent) => agent.did === did)
      .sort((a, b) => b.lastUpdate - a.lastUpdate)[0];
  }

  function setProcessingState(newState: Partial<ProcessingState> | null): void {
    const processing = newState ? ({ ...myState.value.processing, ...newState } as ProcessingState) : null;
    myState.value = { ...myState.value, processing, lastUpdate: Date.now() };
    agents.value[mySessionKey.value] = myState.value;
    broadcastState();
  }

  function updateMyState(key: string, value: any) {
    myState.value = { ...myState.value, [key]: value, lastUpdate: Date.now() };
    agents.value[mySessionKey.value] = myState.value;
    broadcastState();
  }

  // These getters drive "who is here / in the call" UI, so they present one
  // entry per person — sessions of the same agent are deduped by DID.
  function getAgentsInChannel(channelId?: string) {
    return computed<AgentData[]>(() => {
      return dedupeByDid(
        agentsWithProfiles.value.filter(
          (agent) =>
            !['offline', 'invisible'].includes(agent.status) &&
            agent.currentRoute?.channelId === stripChannelPrefix(channelId || ''),
        ),
      );
    });
  }

  function getAgentsInCall(channelId?: string) {
    return computed<AgentData[]>(() =>
      dedupeByDid(
        agentsWithProfiles.value.filter(
          (agent) =>
            !['offline', 'invisible'].includes(agent.status) &&
            agent.callRoute?.channelId === stripChannelPrefix(channelId || ''),
        ),
      ),
    );
  }

  // Watch for changes in the agents map and update agentsWithProfiles
  watch(
    [agents, () => appStore.ad4mClient],
    async ([newAgents]) => {
      if (!appStore.ad4mClient) return;

      const agentEntries = Object.values(newAgents);
      agentsWithProfiles.value = await Promise.all(
        agentEntries.map(async (agent) => ({
          ...agent,
          ...(await getCachedAgentProfile(agent.did, appStore.ad4mClient)),
        })),
      );
    },
    { deep: true, immediate: true },
  );

  // Run the broadcast loop whenever we're in a call, even if we're not the
  // leader, so this session's call presence reaches the network. When the call
  // ends, a non-leader tab goes quiet again.
  watch(inCall, (nowInCall) => {
    if (!signalling.value) return;
    if (nowInCall) startBroadcasting();
    else if (!tabCoordinator.isLeader.value) stopBroadcasting();
  });

  // Watch for state changes in the stores & broadcast updates to peers
  watch(currentRoute, (newCurrentRoute) => updateMyState('currentRoute', newCurrentRoute));
  watch(callRoute, (newCallRoute) => updateMyState('callRoute', newCallRoute));
  watch(inCall, (newInCallState) => updateMyState('inCall', newInCallState));
  watch(myAgentStatus, (newStatus) => updateMyState('status', newStatus));
  watch(aiEnabled, (newAiEnabledState) => updateMyState('aiEnabled', newAiEnabledState));
  watch(mediaSettings, (newMediaSettings) => updateMyState('mediaSettings', newMediaSettings));

  return {
    signalling,
    agents,
    startSignalling,
    stopSignalling,
    addSignalHandler,
    removeSignalHandler,
    sendSignal,
    setProcessingState,
    getAgentState,
    getAgentsInChannel,
    getAgentsInCall,
  };
}
