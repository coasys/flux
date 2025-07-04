import { useAiStore, useAppStore, useMediaDevicesStore, useRouteMemoryStore, useWebrtcStore } from "@/stores";
import { Link, NeighbourhoodProxy, PerspectiveExpression } from "@coasys/ad4m";
import { AgentState, AgentStatus, ProcessingState, SignallingService } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";

export const HEARTBEAT_INTERVAL = 5000; // 5 seconds between heartbeats
const CLEANUP_INTERVAL = 10000; // 10 seconds between evaluations
const ASLEEP_THRESHOLD = 30000; // 30 seconds before "asleep"
const MAX_AGE = 60000; // 60 seconds before "offline"
const NEW_STATE = "agent/new-state";

export function useSignallingService(communityId: string, neighbourhood: NeighbourhoodProxy): SignallingService {
  const appStore = useAppStore();
  const webrtcStore = useWebrtcStore();
  const mediaDevicesStore = useMediaDevicesStore();
  const routeMemoryStore = useRouteMemoryStore();
  const aiStore = useAiStore();

  const { me } = storeToRefs(appStore);
  const { inCall, callRoute, myAgentStatus } = storeToRefs(webrtcStore);
  const { mediaSettings } = storeToRefs(mediaDevicesStore);
  const { currentRoute } = storeToRefs(routeMemoryStore);
  const { defaultLLM } = storeToRefs(aiStore);

  const signalling = ref(false);
  const myState = ref<AgentState>({
    currentRoute: currentRoute.value,
    status: myAgentStatus.value,
    callRoute: callRoute.value,
    mediaSettings: mediaSettings.value,
    aiEnabled: !!defaultLLM.value,
    inCall: false,
    processing: null,
    lastUpdate: Date.now(),
  });

  const sampleAgents = {
    // 1: {
    //   aiEnabled: true,
    //   callRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
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
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
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
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
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
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
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
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
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
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
    //     viewId: "@coasys/flux-chat-view",
    //   },
    //   currentRoute: {
    //     communityId: "bdce1be5-ec8f-4242-bad0-124428daaf48",
    //     channelId: "literal://string:ppfcssybewchueydyctoqkht",
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

  const agents = ref<Record<string, AgentState>>(sampleAgents);
  const signalHandlers = ref<Array<(signal: PerspectiveExpression) => void>>([]);

  let heartbeatTimeout: NodeJS.Timeout | null = null;
  let cleanupInterval: NodeJS.Timeout | null = null;

  function addSignalHandler(handler: (signal: PerspectiveExpression) => void): void {
    signalHandlers.value.push(handler);
  }

  function removeSignalHandler(handler: (signal: PerspectiveExpression) => void): void {
    const index = signalHandlers.value.indexOf(handler);
    if (index !== -1) signalHandlers.value.splice(index, 1);
  }

  function sendSignal(link: Link): void {
    neighbourhood.sendBroadcastU({ links: [link] }).catch((error) => console.error("Error sending signal:", error));
  }

  function onSignal(signal: PerspectiveExpression): void {
    const link = signal.data.links[0];
    if (!link) return;

    const { author, data } = link;
    const { source, predicate, target } = data;

    if (predicate === NEW_STATE && link.author !== me.value.did) {
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
    signalHandlers.value.forEach((handler) => handler(signal));
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

      // Only evaluate if needed - don't change active to active
      if (timeSinceLastUpdate <= ASLEEP_THRESHOLD && agent.status === "active") return;

      // Determine status based on time since last update
      let newStatus: AgentStatus;
      if (timeSinceLastUpdate <= ASLEEP_THRESHOLD) newStatus = "active";
      else if (timeSinceLastUpdate < MAX_AGE) newStatus = "asleep";
      else newStatus = "offline";

      // Only update if status changed
      if (newStatus !== agent.status) agents.value[did] = { ...agent, status: newStatus };
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

    // Add my agent state to the agents map
    agents.value[me.value.did] = myState.value;

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

  function setProcessingState(newState: Partial<ProcessingState> | null): void {
    const processing = newState ? ({ ...myState.value.processing, ...newState } as ProcessingState) : null;
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
  watch(defaultLLM, (newDefaultLLM) => updateMyState("aiEnabled", !!newDefaultLLM));
  watch(mediaSettings, (newMediaSettings) => updateMyState("mediaSettings", newMediaSettings));

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
