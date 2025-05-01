import { useAppStore } from "@/store/app";
import { NeighbourhoodProxy, PerspectiveExpression } from "@coasys/ad4m";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, ref } from "vue";

const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const CLEANUP_INTERVAL = 15000; // 15 seconds
const MAX_AGE = 30000; // 30 seconds
const HEARTBEAT = "agent/heartbeat";
const IN_COMMUNITY = "agent/in-community";
const IN_CHANNEL = "agent/in-channel";

type AgentStatus = "active" | "asleep" | "in-call" | "offline" | "unknown";

interface AgentState {
  status: AgentStatus;
  processing: boolean;
  communityId: string;
  channelId: string;
  lastUpdate: number;
}

export function useSignalingService(neighbourhood: NeighbourhoodProxy) {
  const appStore = useAppStore();
  const { activeCommunityId, activeChannelId } = storeToRefs(appStore);
  const { me } = appStore;

  const signalling = ref(false);
  const myState = ref<AgentState>({
    status: "active",
    processing: false,
    communityId: activeCommunityId.value,
    channelId: activeChannelId.value,
    lastUpdate: Date.now(),
  });
  const agents = ref<Record<string, any>>({});
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let cleanupInterval: NodeJS.Timeout | null = null;

  function onSignal(signal: PerspectiveExpression) {
    const link = signal.data.links[0];
    if (!link || link.author === me.did) return;

    const { author, data } = link;
    const { predicate, source, target } = data;

    if (predicate === HEARTBEAT) {
      try {
        // Parse the agent's state and add it to the store
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
    const myHeartbeatState = { source: me.did, predicate: HEARTBEAT, target: JSON.stringify(myState.value) };
    neighbourhood
      .sendBroadcastU({ links: [myHeartbeatState] })
      .catch((error) => console.error("Error sending heartbeat:", error));
  }

  function cleanupStaleAgents() {
    // Mark agents as offline if their last update is older than MAX_AGE
    const now = Date.now();
    Object.keys(agents.value).forEach((did) => {
      const agent = agents.value[did];
      const stale = now - agent.lastUpdate >= MAX_AGE;
      const alreadyOffline = agent.status === "offline";
      if (stale && !alreadyOffline) agents.value[did] = { ...agent, status: "offline" };
    });
  }

  function startSignaling() {
    // Clean up previous signal handler if present & set signalling to true
    if (signalling.value) stopSignaling();
    signalling.value = true;

    // Add the signal handler
    neighbourhood.addSignalHandler(onSignal);

    // Start the heartbeat interval
    heartbeatInterval = setInterval(() => broadcastState(), HEARTBEAT_INTERVAL);

    // Start the cleanup interval
    cleanupInterval = setInterval(() => cleanupStaleAgents(), CLEANUP_INTERVAL);
  }

  function stopSignaling() {
    // Remove the signal handler
    neighbourhood.removeSignalHandler(onSignal);

    // Clear the heartbeat interval
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    // Clear the cleanup interval
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }

    signalling.value = false;
  }

  function setStatus(status: AgentStatus) {
    myState.value = { ...myState.value, status, lastUpdate: Date.now() };
  }

  function setProcessing(processing: boolean) {
    myState.value = { ...myState.value, processing, lastUpdate: Date.now() };
  }

  // Get active agents (seen in last 15 seconds)
  const activeAgents = computed(() => {
    const now = Date.now();
    const maxAge = 15000;
    return Object.values(agents.value).filter((agent: AgentState) => {
      return now - agent.lastUpdate < maxAge;
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
