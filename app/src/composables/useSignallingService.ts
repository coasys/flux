import { useAppStore, useRouteMemoryStore } from "@/stores";
import { useMediaDevicesStore } from "@/stores/mediaDevicesStore";
import { useWebrtcStore } from "@/stores/webrtcStore";
import { Link, NeighbourhoodProxy, PerspectiveExpression } from "@coasys/ad4m";
import { AgentState, ProcessingState, SignallingService } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";

const HEARTBEAT_INTERVAL = 5000;
const CLEANUP_INTERVAL = 15000;
const MAX_AGE = 30000;
const NEW_STATE = "agent/new-state";

export function useSignallingService(communityId: string, neighbourhood: NeighbourhoodProxy): SignallingService {
  const appStore = useAppStore();
  const webrtcStore = useWebrtcStore();
  const mediaDevicesStore = useMediaDevicesStore();
  const routeMemoryStore = useRouteMemoryStore();

  const { me, aiEnabled } = storeToRefs(appStore);
  const { inCall, callRoute, myAgentStatus } = storeToRefs(webrtcStore);
  const { mediaSettings } = storeToRefs(mediaDevicesStore);
  const { currentRoute } = storeToRefs(routeMemoryStore);

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
  });
  const agents = ref<Record<string, AgentState>>({});
  const signalHandlers: Array<(signal: PerspectiveExpression) => void> = [];

  let heartbeatTimeout: NodeJS.Timeout | null = null;
  let cleanupInterval: NodeJS.Timeout | null = null;

  function addSignalHandler(handler: (signal: PerspectiveExpression) => void): void {
    signalHandlers.push(handler);
  }

  function removeSignalHandler(handler: (signal: PerspectiveExpression) => void): void {
    const index = signalHandlers.indexOf(handler);
    if (index !== -1) signalHandlers.splice(index, 1);
    else console.warn("Signal handler not found:", handler);
  }

  function sendSignal(link: Link): void {
    neighbourhood.sendBroadcastU({ links: [link] }).catch((error) => console.error("Error sending signal:", error));
  }

  function onSignal(signal: PerspectiveExpression): void {
    const link = signal.data.links[0];
    if (!link || link.author === me.value.did) return;

    const { author, data } = link;
    const { source, predicate, target } = data;

    if (predicate === NEW_STATE) {
      // If this is their first broadcast, immediately broadcast my state so they dont have to wait for my next heartbeat
      if (target === "first-broadcast") broadcastState();

      try {
        // Try to parse the agent's state and add it to the store
        const agentState = JSON.parse(source);
        if (typeof agentState === "object" && agentState !== null) {
          agents.value[author] = { ...agents.value[author], ...agentState, lastUpdate: Date.now() };
        }
      } catch (error) {
        console.error("Error parsing agent state:", error);
        agents.value[author] = { ...agents.value[author], status: "unknown", lastUpdate: Date.now() };
      }
    }

    // Forward signals to added signal handlers if present (used in the webrtc store)
    signalHandlers.forEach((handler) => handler(signal));
  }

  function broadcastState(target: string = ""): void {
    if (!signalling.value) return;

    // Broadcast my state to the neighbourhood
    const newState = { source: JSON.stringify(myState.value), predicate: NEW_STATE, target };
    neighbourhood
      .sendBroadcastU({ links: [newState] })
      .catch((error) => console.error("Error sending broadcast:", error));
  }

  // TODO: better distinguish between manually set agent status and signalling health
  function evaluateAgents(): void {
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
    cleanupInterval = setInterval(evaluateAgents, CLEANUP_INTERVAL);
  }

  function stopSignalling(): void {
    // Remove the signal handler
    neighbourhood.removeSignalHandler(onSignal);

    // Clear the intervals
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }

    // Mark signaling as inactive to allow future restarts
    signalling.value = false;
  }

  function getAgentState(did: string): AgentState | undefined {
    return agents.value[did];
  }

  function setProcessingState(newState: ProcessingState): void {
    const processing = newState ? { ...myState.value.processing, ...newState } : null;
    myState.value = { ...myState.value, processing, lastUpdate: Date.now() };
    agents.value[me.value.did] = myState.value;
    broadcastState();
  }

  function updateMyState(key: string, value: any) {
    myState.value = { ...myState.value, [key]: value, lastUpdate: Date.now() };
    agents.value[me.value.did] = myState.value;
    broadcastState();
  }

  // Watch for state changes in the stores & broadcast updates to peers
  watch(currentRoute, (newCurrentRoute) => updateMyState("currentRoute", newCurrentRoute));
  watch(callRoute, (newCallRoute) => updateMyState("callRoute", newCallRoute));
  watch(inCall, (newInCallState) => updateMyState("inCall", newInCallState));
  watch(myAgentStatus, (newStatus) => updateMyState("status", newStatus));
  watch(aiEnabled, (newAiEnabledState) => updateMyState("aiEnabled", newAiEnabledState));

  // TODO: remove
  // Send updates to web components whenever the agents state map changes
  watch(
    agents,
    (newAgentsState) =>
      window.dispatchEvent(new CustomEvent(`${communityId}-new-agents-state`, { detail: newAgentsState })),
    { immediate: true }
  );

  return {
    signalling,
    agents,
    setProcessingState,
    getAgentState,
    startSignalling,
    stopSignalling,
    addSignalHandler,
    removeSignalHandler,
    sendSignal,
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
