import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Channel } from "@coasys/flux-api";
import { AgentState, AgentStatus, CallHealth, Profile, RouteParams } from "@coasys/flux-types";
import { getForVersion, setForVersion } from "@coasys/flux-utils";
import { defineStore, storeToRefs } from "pinia";
import SimplePeer from "simple-peer";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "./appStore";
import { useCommunityServiceStore } from "./communityServiceStore";
import { useMediaDevicesStore } from "./mediaDevicesStore";

export const CALL_HEALTH_CHECK_INTERVAL = 6000;

export type PeerConnection = {
  did: string;
  peer: SimplePeer.Instance;
  streams: MediaStream[];
  initiator: boolean;
};

type AgentWithProfile = AgentState & Profile;

export const useWebrtcStore = defineStore("webrtcStore", () => {
  const route = useRoute();
  const appStore = useAppStore();
  const mediaDevicesStore = useMediaDevicesStore();
  const communityServiceStore = useCommunityServiceStore();

  const { me } = storeToRefs(appStore);
  const { stream: localStream, audioEnabled, videoEnabled } = storeToRefs(mediaDevicesStore);
  const { getCommunityService } = communityServiceStore;

  // Call state
  const callRoute = ref<RouteParams | null>(route.params);
  const communityService = computed(() => getCommunityService(callRoute.value?.communityId || ""));
  const signallingService = computed(() => communityService.value?.signallingService);
  const agentsInCommunity = computed<Record<string, AgentState>>(() => signallingService.value?.agents || {});
  const agentsInCall = ref<AgentWithProfile[]>([]);
  const callHealth = ref<CallHealth>("healthy");
  const community = computed(() => communityService.value?.community || null);
  const channel = computed(() =>
    (communityService.value?.channels as any)?.find((c: Channel) => c.baseExpression === callRoute.value?.channelId)
  );

  // Connection state
  const peerConnections = ref<Map<string, PeerConnection>>(new Map());
  const isConnected = ref<boolean>(false);
  const isConnecting = ref<boolean>(false);
  const agentStatus = ref<AgentStatus>("active");

  // ICE servers configuration
  const iceServers = ref([{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }]);

  let healthCheckInterval: NodeJS.Timeout | null = null;

  // Computed values for remote streams
  const remoteStreams = computed(() => {
    const streams: Record<string, MediaStream[]> = {};
    peerConnections.value.forEach((peer, did) => (streams[did] = peer.streams));
    return streams;
  });

  function checkCallHealth(): void {
    // Check the last update time of each peer to determine if the call is healthy
    const now = Date.now();
    const { connectionsLost, warnings } = agentsInCall.value.reduce(
      (health, agent) => {
        const timeSinceLastUpdate = now - agent.lastUpdate;
        if (timeSinceLastUpdate > CALL_HEALTH_CHECK_INTERVAL * 2) health.connectionsLost = true;
        else if (timeSinceLastUpdate > CALL_HEALTH_CHECK_INTERVAL) health.warnings = true;
        return health;
      },
      { connectionsLost: false, warnings: false }
    );
    const newCallHealth = connectionsLost ? "connections-lost" : warnings ? "warnings" : "healthy";
    if (callHealth.value !== newCallHealth) callHealth.value = newCallHealth;
  }

  function createPeerConnection(did: string, initiator: boolean): SimplePeer.Instance {
    // Check if we already have a connection for this peer
    const existingPeer = peerConnections.value.get(did);
    if (existingPeer) {
      existingPeer.peer.destroy();
      peerConnections.value.delete(did);
    }

    console.log(`Creating ${initiator ? "initiator" : "receiver"} peer for ${did}`);

    const peerOptions = { initiator, stream: localStream.value || undefined, config: { iceServers: iceServers.value } };
    const peer = new SimplePeer(peerOptions);

    // Set up event handlers
    peer.on("signal", (data) => {
      // Send signal data through signaling service
      if (!signallingService.value) {
        console.error("No signalling service available");
        return;
      }

      signallingService.value.sendMessage(
        "webrtc-signal",
        {
          targetDid: did,
          signalData: data,
        },
        [did]
      );
    });

    peer.on("connect", () => {
      console.log(`Connected to peer ${did}`);
      // // Send current state
      // peer.send(
      //   JSON.stringify({
      //     type: "state",
      //     state: { audio: audioEnabled.value, video: videoEnabled.value, screen: false },
      //   })
      // );
    });

    peer.on("stream", (stream) => {
      console.log(`Received stream from peer ${did}`);
      const peerConnection = peerConnections.value.get(did);
      if (peerConnection) {
        peerConnection.streams = [stream]; // SimplePeer typically gives one combined stream
        peerConnections.value.set(did, peerConnection);
      }
    });

    peer.on("track", (track, stream) => {
      console.log(`Received track from peer ${did}: ${track.kind}`);
    });

    // peer.on("data", (data) => {
    //   try {
    //     const message = JSON.parse(data.toString());
    //     console.log(`Received message from peer ${did}:`, message);

    //     if (message.type === "state" && signallingService.value) {
    //       // Update the agent's state in the signaling service
    //       const agentState = signallingService.value.agents[did];
    //       if (agentState) {
    //         agentState.mediaState = message.state;
    //       }
    //     }
    //   } catch (e) {
    //     console.error("Error parsing message from peer", e);
    //   }
    // });

    peer.on("close", () => {
      console.log(`Connection closed with peer ${did}`);
      cleanupPeerConnection(did);
    });

    peer.on("error", (err) => {
      console.error(`Error in connection with peer ${did}:`, err);
      cleanupPeerConnection(did);
    });

    // Store the peer connection
    peerConnections.value.set(did, { did, peer, streams: [], initiator });

    return peer;
  }

  function cleanupPeerConnection(did: string) {
    const peerConnection = peerConnections.value.get(did);
    if (peerConnection) {
      try {
        peerConnection.peer.destroy();
      } catch (e) {
        console.error(`Error destroying peer ${did}:`, e);
      }
      peerConnections.value.delete(did);
    }
  }

  function updatePeerConnectionsWithLocalStream() {
    if (!localStream.value) return;

    peerConnections.value.forEach((peerConnection, did) => {
      // With SimplePeer, we need to recreate the peer to update the stream
      peerConnection.peer.destroy();

      // Create a new peer with the updated stream
      createPeerConnection(did, peerConnection.initiator);
    });
  }

  // Call management functions
  async function joinRoom(communityId?: string, channelId?: string) {
    if (isConnected.value) {
      console.log("Already in a call, leaving first");
      await leaveRoom();
    }

    isConnecting.value = true;

    try {
      // Set call route from params or arguments
      const newCommunityId = communityId || (route.params.communityId as string);
      const newChannelId = channelId || (route.params.channelId as string);

      if (!newCommunityId || !newChannelId) {
        throw new Error("Missing community or channel ID");
      }

      callRoute.value = {
        communityId: newCommunityId,
        channelId: newChannelId,
      };

      // Wait for the signallingService to be available
      const maxAttempts = 10;
      let attempts = 0;

      while (!signallingService.value && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!signallingService.value) {
        throw new Error("Signalling service not available after waiting");
      }

      // Enable media devices depending on stored preferences
      const shouldEnableAudio = getForVersion("webrtc", "enableAudio") !== "false";
      const shouldEnableVideo = getForVersion("webrtc", "enableVideo") === "true";

      // Request permissions and get media stream
      if (shouldEnableAudio || shouldEnableVideo) {
        await mediaDevicesStore.requestPermissions({
          audio: shouldEnableAudio,
          video: shouldEnableVideo,
        });
      }

      // Set up signaling message handler
      const messageHandler = (did: string, type: string, message: any) => {
        if (type === "webrtc-signal" && did !== signallingService.value?.myDid) {
          const peer = peerConnections.value.get(did)?.peer;
          if (peer) {
            try {
              peer.signal(message.signalData);
            } catch (e) {
              console.error(`Error processing signal from ${did}:`, e);
              cleanupPeerConnection(did);
            }
          } else {
            // If we don't have a peer yet, create one as a receiver
            const newPeer = createPeerConnection(did, false);
            // Then process the signal
            newPeer.signal(message.signalData);
          }
        }
      };

      signallingService.value.onMessage(messageHandler);

      // Set the call route in signaling service
      signallingService.value.setCallRoute({
        communityId: newCommunityId,
        channelId: newChannelId,
      });

      // Set agent status to active
      setAgentStatus("active");

      // Establish connections with existing peers
      if (agentsInCall.value.length > 0) {
        console.log("Connecting to existing agents:", agentsInCall.value.length);
        agentsInCall.value.forEach((agent) => {
          if (agent.did !== signallingService.value?.myDid) {
            // Create initiator connections to all peers alphabetically "less than" our did
            // This prevents both sides from being initiators
            const shouldInitiate = (signallingService.value?.myDid || "").localeCompare(agent.did) > 0;
            createPeerConnection(agent.did, shouldInitiate);
          }
        });
      }

      isConnected.value = true;

      // Tell media devices store we're in a call
      mediaDevicesStore.setActiveCall(`${newCommunityId}-${newChannelId}`);
    } catch (error) {
      console.error("Error joining call:", error);
      callRoute.value = null;
    } finally {
      isConnecting.value = false;
    }
  }

  async function leaveRoom() {
    try {
      // Close all peer connections
      peerConnections.value.forEach((peer, did) => {
        cleanupPeerConnection(did);
      });

      // Clear the call route in signaling service
      if (signallingService.value) {
        signallingService.value.setCallRoute(null);
      }

      // Release media devices
      mediaDevicesStore.setActiveCall(null);

      // Reset state
      isConnected.value = false;
      callRoute.value = null;
    } catch (error) {
      console.error("Error leaving call:", error);
    }
  }

  function toggleAudio() {
    const newState = !audioEnabled.value;

    if (mediaDevicesStore.mediaPermissions.microphone.granted || !newState) {
      // If we already have permission or we're disabling, just toggle
      mediaDevicesStore.toggleTrack("audio", newState);
    } else {
      // If we're enabling and don't have permission, request it
      mediaDevicesStore.requestPermissions({ audio: true, video: false });
    }

    // Save preference
    setForVersion("webrtc", "enableAudio", newState ? "true" : "false");
  }

  function toggleVideo() {
    const newState = !videoEnabled.value;

    if (mediaDevicesStore.mediaPermissions.camera.granted || !newState) {
      // If we already have permission or we're disabling, just toggle
      mediaDevicesStore.toggleTrack("video", newState);
    } else {
      // If we're enabling and don't have permission, request it
      mediaDevicesStore.requestPermissions({ audio: false, video: true });
    }

    // Save preference
    setForVersion("webrtc", "enableVideo", newState ? "true" : "false");
  }

  function setAgentStatus(status: AgentStatus) {
    agentStatus.value = status;

    if (signallingService.value) {
      signallingService.value.setAgentStatus(status);
    }
  }

  // Watch for media stream changes to update peer connections
  watch(localStream, () => {
    if (isConnected.value) updatePeerConnectionsWithLocalStream();
  });

  // Update agentsInCall when the agents map in the signalling service changes
  watch(
    agentsInCommunity,
    async (newAgents) => {
      const agentsInCallMap = Object.entries(newAgents).filter(
        ([_, agent]) => agent.callRoute?.channelId === callRoute.value?.channelId
      );
      agentsInCall.value = await Promise.all(
        agentsInCallMap.map(async ([did, agent]) => ({ ...agent, ...(await getCachedAgentProfile(did)) }))
      );
    },
    { deep: true }
  );

  // Create peer connections for new agents in call
  watch(
    agentsInCall,
    (newAgents) => {
      if (!isConnected.value) return;

      const existingPeerDids = Array.from(peerConnections.value.keys());

      // Handle new agents
      newAgents.forEach((agent) => {
        // const agentDid = agent.did;

        // Skip ourselves
        if (agent.did === me.value.did) return;

        // If we don't already have a peer connection with this agent, create one
        if (!peerConnections.value.has(agent.did)) {
          console.log("New peer connection needed for:", agent.did);

          // Determine whether we should be the initiator
          const shouldInitiate = me.value.did.localeCompare(agent.did) > 0;
          createPeerConnection(agent.did, shouldInitiate);
        } else {
          // We already have a connection - might want to check its health
          console.log("Existing peer connection found for:", agent.did);
        }
      });

      // Handle agents that left the call or are no longer active
      existingPeerDids.forEach((did) => {
        if (!newAgents.map((a) => a.did).includes(did)) {
          console.log("Cleaning up peer connection for:", did);
          cleanupPeerConnection(did);
        }
      });
    },
    { deep: true }
  );

  // Start or stop the health check interval when the call route changes
  watch(
    callRoute,
    (newCallRoute) => {
      // If in a call, start the health check interval
      if (newCallRoute) healthCheckInterval = setInterval(checkCallHealth, CALL_HEALTH_CHECK_INTERVAL);
      // Otherwise clear the existing interval if present
      else if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
      }
    },
    { immediate: true }
  );

  // Clean up when store is no longer used
  onUnmounted(() => {
    if (isConnected.value) {
      leaveRoom();
    }
  });

  return {
    // Call state
    callRoute,
    audioEnabled,
    videoEnabled,
    agentStatus,
    isConnected,
    isConnecting,
    agentsInCall,
    callHealth,
    community,
    channel,

    // WebRTC state
    peerConnections,
    remoteStreams,

    // Call management
    joinRoom,
    leaveRoom,

    // Media controls
    toggleVideo,
    toggleAudio,
    setAgentStatus,

    // Signaling access (for advanced use cases)
    signallingService,
  };
});

// import { getCachedAgentProfile } from "@/utils/userProfileCache";
// import { Channel } from "@coasys/flux-api";
// import { AgentState, AgentStatus, CallHealth, RouteParams } from "@coasys/flux-types";
// import { defineStore, storeToRefs } from "pinia";
// import { computed, ref, watch } from "vue";
// import { useRoute } from "vue-router";
// import { useCommunityServiceStore } from "./communityServiceStore";
// import { useMediaDevicesStore } from "./mediaDevicesStore";

// export const useWebrtcStore = defineStore("webrtcStore", () => {
//   const route = useRoute();
//   const mediaDevicesStore = useMediaDevicesStore();
//   const communityServiceStore = useCommunityServiceStore();

//   const { stream, audioEnabled, videoEnabled } = storeToRefs(mediaDevicesStore);
//   const { getCommunityService } = communityServiceStore;

//   // const instance = ref<WebRTC | undefined>();
//   const callRoute = ref<RouteParams | null>(route.params);
//   const communityService = computed(() => getCommunityService(callRoute.value?.communityId || ""));
//   const signallingService = computed(() => communityService.value?.signallingService);
//   const agents = computed<Record<string, AgentState>>(() => signallingService.value?.agents || {});
//   const agentsInCall = ref<AgentState[]>([]);
//   const callHealth = computed(() => signallingService.value?.callHealth || ("healthy" as CallHealth));
//   const community = computed(() => communityService.value?.community || null);
//   const channel = computed(() =>
//     (communityService.value?.channels as any).find((c: Channel) => c.baseExpression === callRoute.value?.channelId)
//   );

//   const agentStatus = ref<AgentStatus>("active");

//   // async function addInstance(webRTC: WebRTC) {
//   //   instance.value = webRTC;
//   // }

//   // async function joinRoom() {
//   //   instance.value?.onJoin({});

//   //   // // Todo: fix loading state in UI so this timeout is not needed
//   //   setTimeout(() => {
//   //     callRoute.value = route.params as RouteParams; // route.params as RouteParams;
//   //   }, 100);
//   // }

//   // function leaveRoom() {
//   //   instance.value?.onLeave();
//   //   instance.value = undefined;
//   //   callRoute.value = null;
//   // }

//   // function toggleAudio() {
//   //   instance.value?.onToggleAudio(!audioEnabled.value);
//   //   audioEnabled.value = !audioEnabled.value;
//   // }

//   // function toggleVideo() {
//   //   instance.value?.onToggleCamera(!videoEnabled.value);
//   //   videoEnabled.value = !videoEnabled.value;
//   // }

//   // Update agentsInCall when agents map in the signalling service changes
//   watch(
//     agents,
//     async (newAgents) => {
//       const agentsInCallMap = Object.entries(newAgents).filter(
//         ([_, agent]) => agent.callRoute?.channelId === callRoute.value?.channelId
//       );
//       agentsInCall.value = await Promise.all(
//         agentsInCallMap.map(async ([did, agent]) => ({ ...agent, ...(await getCachedAgentProfile(did)) }))
//       );
//     },
//     { deep: true }
//   );

//   return {
//     // instance,
//     callRoute,
//     videoEnabled,
//     audioEnabled,
//     agentStatus,
//     // addInstance,
//     // joinRoom,
//     // leaveRoom,
//     // toggleVideo,
//     // toggleAudio,
//   };
// });
