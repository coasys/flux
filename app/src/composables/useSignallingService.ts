import { useAppStore } from "@/store";
import { NeighbourhoodProxy, PerspectiveExpression } from "@coasys/ad4m";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, ref } from "vue";

const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const CLEANUP_INTERVAL = 15000; // 15 seconds
const MAX_AGE = 30000; // 30 seconds
const HEARTBEAT = "agent/heartbeat";
const IN_COMMUNITY = "agent/in-community";
const IN_CHANNEL = "agent/in-channel";

export type AgentStatus = "active" | "asleep" | "in-call" | "offline" | "unknown";

export interface AgentState {
  status: AgentStatus;
  processing: boolean;
  communityId: string;
  channelId: string;
  lastUpdate: number;
}

export function useSignalingService(neighbourhood: NeighbourhoodProxy) {
  const app = useAppStore();
  const { me, activeCommunityId, activeChannelId } = storeToRefs(app);

  const signalling = ref(false);
  const myState = ref<AgentState>({
    status: "active",
    processing: false,
    communityId: activeCommunityId.value,
    channelId: activeChannelId.value,
    lastUpdate: Date.now(),
  });
  const agents = ref<Record<string, AgentState>>({});
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let cleanupInterval: NodeJS.Timeout | null = null;

  function onSignal(signal: PerspectiveExpression) {
    const link = signal.data.links[0];
    if (!link || link.author === me.value.did) return;

    const { author, data } = link;
    const { predicate, source, target } = data;

    if (predicate === HEARTBEAT) {
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

    if (predicate === IN_COMMUNITY) {
      agents.value[author] = { ...agents.value[author], communityId: target, lastUpdate: Date.now() };
    }

    if (predicate === IN_CHANNEL) {
      agents.value[author] = { ...agents.value[author], channelId: target, lastUpdate: Date.now() };
    }
  }

  function broadcastState() {
    // Broadcast my state to the neighbourhood
    const myHeartbeatState = { source: me.value.did, predicate: HEARTBEAT, target: JSON.stringify(myState.value) };
    neighbourhood
      .sendBroadcastU({ links: [myHeartbeatState] })
      .catch((error) => console.error("Error sending heartbeat:", error));
  }

  function updateAgentStatuses() {
    // Mark agents as asleep or offline if their last update is older than the HEARTBEAT_INTERVAL
    const now = Date.now();
    Object.keys(agents.value).forEach((did) => {
      const agent = agents.value[did];
      const timeSinceLastUpdate = now - agent.lastUpdate;
      if (timeSinceLastUpdate <= HEARTBEAT_INTERVAL) return;

      const status = timeSinceLastUpdate < MAX_AGE ? "asleep" : "offline";
      if (status !== agent.status) agents.value[did] = { ...agent, status };
    });
  }

  function startSignaling() {
    // Clean up previous signal handler if present
    if (signalling.value) stopSignaling();
    signalling.value = true;

    // Add the signal handler
    neighbourhood.addSignalHandler(onSignal);

    // Start the intervals
    heartbeatInterval = setInterval(() => broadcastState(), HEARTBEAT_INTERVAL);
    cleanupInterval = setInterval(() => updateAgentStatuses(), CLEANUP_INTERVAL);

    // Broadcast my first heartbeat
    broadcastState();
  }

  function stopSignaling() {
    // Remove the signal handler
    neighbourhood.removeSignalHandler(onSignal);

    // Clear the intervals
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }

    // Mark signaling as inactive to allow future restarts
    signalling.value = false;
  }

  function setStatus(status: AgentStatus) {
    myState.value = { ...myState.value, status, lastUpdate: Date.now() };
  }

  function setProcessing(processing: boolean) {
    myState.value = { ...myState.value, processing, lastUpdate: Date.now() };
  }

  const activeAgents = computed(() => {
    return Object.values(agents.value).filter((agent: AgentState) => {
      return agent.status === "active";
    });
  });

  // Clean up on unmount
  onBeforeUnmount(() => stopSignaling());

  return {
    // State
    signalling,
    agents,
    activeAgents,

    // Methods
    startSignaling,
    stopSignaling,
    setStatus,
    setProcessing,
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
