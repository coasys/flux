import { useAppStore } from "@/store";
import { useWebRTCStore } from "@/store/webrtc";
import { NeighbourhoodProxy, PerspectiveExpression } from "@coasys/ad4m";
import { AgentState, ProcessingState, RouteParams, SignallingService } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";

const HEARTBEAT_INTERVAL = 5000;
const CLEANUP_INTERVAL = 15000;
const MAX_AGE = 30000;
const CALL_HEALTH_CHECK_INTERVAL = 10000;
const NEW_STATE = "agent/new-state";

export function useSignallingService(communityId: string, neighbourhood: NeighbourhoodProxy): SignallingService {
  const appStore = useAppStore();
  const webrtc = useWebRTCStore();

  const { me, aiEnabled } = storeToRefs(appStore);
  const { instance, callRoute, agentStatus } = storeToRefs(webrtc);

  const signalling = ref(false);
  const myState = ref<AgentState>({
    status: agentStatus.value,
    currentRoute: null,
    callRoute: null,
    processing: null,
    aiEnabled: aiEnabled.value,
    lastUpdate: Date.now(),
  });
  const agents = ref<Record<string, AgentState>>({});
  const callHealthy = ref(true);

  let heartbeatTimeout: NodeJS.Timeout | null = null;
  let cleanupInterval: NodeJS.Timeout | null = null;
  let callHealthCheckInterval: NodeJS.Timeout | null = null;

  function onSignal(signal: PerspectiveExpression): void {
    const link = signal.data.links[0];
    if (!link || link.author === me.value.did) return;

    const { author, data } = link;
    const { predicate, source, target } = data;

    if (predicate === NEW_STATE) {
      // If this is their first broadcast, immediately respond with my state so they dont have to wait for my next heartbeat
      if (source === "first-broadcast") broadcastState();

      try {
        // Try to parse the agent's state and add it to the store
        const agentState = JSON.parse(target);
        if (typeof agentState === "object" && agentState !== null) {
          agents.value[author] = { ...agents.value[author], ...agentState, lastUpdate: Date.now() };
        }
      } catch (error) {
        console.error("Error parsing agent state:", error);
        agents.value[author] = { ...agents.value[author], status: "unknown", lastUpdate: Date.now() };
      }
    }
  }

  function broadcastState(source: string = ""): void {
    if (signalling.value === false) return;

    // Broadcast my state to the neighbourhood
    const newState = { source, predicate: NEW_STATE, target: JSON.stringify(myState.value) };
    neighbourhood
      .sendBroadcastU({ links: [newState] })
      .catch((error) => console.error("Error sending broadcast:", error));
  }

  function updateAgentStatuses(): void {
    const now = Date.now();
    Object.keys(agents.value).forEach((did) => {
      // Skip if agent is me
      if (did === me.value.did) return;

      // Mark agents as asleep or offline if their last update is older than the HEARTBEAT_INTERVAL
      const agent = agents.value[did];
      const timeSinceLastUpdate = now - agent.lastUpdate;
      if (timeSinceLastUpdate <= HEARTBEAT_INTERVAL) return;

      const status = timeSinceLastUpdate < MAX_AGE ? "asleep" : "offline";
      if (status !== agent.status) agents.value[did] = { ...agent, status };
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
        myState.value = { ...myState.value, lastUpdate: Date.now() };
        agents.value[me.value.did] = myState.value;
        broadcastState();
        scheduleNextHeartbeat(HEARTBEAT_INTERVAL);
      }
    }, delay);
  }

  function startSignalling(): void {
    if (signalling.value) stopSignalling();
    signalling.value = true;

    // Add signal handler
    neighbourhood.addSignalHandler(onSignal);

    // Send first broadcast
    broadcastState("first-broadcast");

    // Schedule first heartbeat
    scheduleNextHeartbeat(HEARTBEAT_INTERVAL);

    // Start the cleanup interval
    cleanupInterval = setInterval(updateAgentStatuses, CLEANUP_INTERVAL);
  }

  function stopSignalling(): void {
    // Remove the signal handler
    neighbourhood.removeSignalHandler(onSignal);

    // // Clear the intervals
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }

    if (callHealthCheckInterval) {
      clearInterval(callHealthCheckInterval);
      callHealthCheckInterval = null;
    }

    // Mark signaling as inactive to allow future restarts
    signalling.value = false;
  }

  function checkCallHealth(): void {
    if (!instance.value) return;

    // Check the last update time of each peer to determine if the call is healthy
    const now = Date.now();
    const healthy = instance.value.connections.every((peer) => {
      const agent = agents.value[peer.did];
      const timeSinceLastUpdate = now - agent.lastUpdate;
      return timeSinceLastUpdate <= CALL_HEALTH_CHECK_INTERVAL;
    });

    // If the calls health has changed, updated the state and emit event for webcomponents
    if (callHealthy.value !== healthy) {
      callHealthy.value = healthy;
      window.dispatchEvent(new CustomEvent(`${communityId}-call-health-update`, { detail: healthy }));
    }
  }

  function getAgentState(did: string): AgentState | undefined {
    return agents.value[did];
  }

  function setCurrentRoute(params: RouteParams): void {
    myState.value = { ...myState.value, currentRoute: params, lastUpdate: Date.now() };
    agents.value[me.value.did] = myState.value;
    broadcastState();
  }

  function setProcessingState(newState: ProcessingState): void {
    const processing = newState ? { ...myState.value.processing, ...newState } : null;
    myState.value = { ...myState.value, processing, lastUpdate: Date.now() };
    agents.value[me.value.did] = myState.value;
    broadcastState();
  }

  const activeAgents = computed(() => {
    return Object.values(agents.value).filter((agent: AgentState) => {
      return agent.status === "active";
    });
  });

  // Watch for callRoute updates in the webrtc store
  watch(
    () => callRoute.value,
    (newCallRoute) => {
      // Update my state & broadcast it to the neighbourhood
      myState.value = { ...myState.value, callRoute: newCallRoute, lastUpdate: Date.now() };
      agents.value[me.value.did] = myState.value;
      broadcastState();

      // If in a call, start the call health check interval
      if (newCallRoute) callHealthCheckInterval = setInterval(checkCallHealth, CALL_HEALTH_CHECK_INTERVAL);
      // Otherwise clear the existing interval (if present)
      else if (callHealthCheckInterval) {
        clearInterval(callHealthCheckInterval);
        callHealthCheckInterval = null;
      }
    },
    { immediate: true, deep: true }
  );

  // Watch for agent status updates in the webrtc store
  watch(
    () => agentStatus.value,
    (newAgentStatus) => {
      // Update my agent status & broadcast it to the neighbourhood
      myState.value = { ...myState.value, status: newAgentStatus, lastUpdate: Date.now() };
      agents.value[me.value.did] = myState.value;
      broadcastState();
    }
  );

  // Watch for aiEnabled updates in the app store
  watch(
    () => aiEnabled.value,
    (newAiEnabledState) => {
      // Update my AI state & broadcast it to the neighbourhood
      myState.value = { ...myState.value, aiEnabled: newAiEnabledState, lastUpdate: Date.now() };
      agents.value[me.value.did] = myState.value;
      broadcastState();
    }
  );

  // Send updates to web components whenever the agents state map changes
  watch(
    () => agents.value,
    (newAgentsState) =>
      window.dispatchEvent(new CustomEvent(`${communityId}-new-agents-state`, { detail: newAgentsState })),
    { immediate: true, deep: true }
  );

  return {
    // State
    signalling,
    agents,
    activeAgents,

    // Setters
    setProcessingState,
    setCurrentRoute,

    // Getters
    getAgentState,

    startSignalling,
    stopSignalling,
  };
}

// // Alternative aproach if sending each state value as a separate link instead of using a stringified object for all the values
// const IS_ACTIVE = "agent/is-active";
// const IS_PROCESSING = "agent/is-processing";
// const IN_COMMUNITY = "agent/in-community";
// const IN_CHANNEL = "agent/in-channel";
// const IN_CALL = "agent/in-call";

// if (signal.links.length > 1) {
//   // Process heatbeat signal
//   const author = signal.links[0]?.author;
//   if (!author || author === me.did) return;

//   // Reduce links into an object
//   const state = signal.links.reduce(
//     (acc: any, link: any) => {
//       if (link.data.predicate === IS_ACTIVE) acc.state = link.target;
//       if (link.data.predicate === IS_PROCESSING) acc.processing = link.target === "true";
//       if (link.data.predicate === IN_COMMUNITY) acc.communityId = link.target;
//       if (link.data.predicate === IN_CHANNEL) acc.channelId = link.target;
//       if (link.data.predicate === IN_CALL) acc.inCall = link.target === "true";
//       return acc;
//     },
//     { did: author }
//   );

//   // Update the agents state in the store
//   agents.value[author] = { ...agents.value[author], ...state, lastSeen: Date.now() };
// } else {
//   // Process other signals
// }
