import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { PerspectiveExpression } from "@coasys/ad4m";
import { Channel, Community } from "@coasys/flux-api";
import { defaultIceServers } from "@coasys/flux-constants/src/videoSettings";
import { AgentState, AgentStatus, CallHealth, Profile, RouteParams } from "@coasys/flux-types";
import { defineStore, storeToRefs } from "pinia";
import SimplePeer from "simple-peer";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "./appStore";
import { useCommunityServiceStore } from "./communityServiceStore";
import { useMediaDevicesStore } from "./mediaDevicesStore";
import { useUiStore } from "./uiStore";

export const CALL_HEALTH_CHECK_INTERVAL = 6000;
export const WEBRTC_SIGNAL = "webrtc/signal";
const MAX_RECONNECTION_ATTEMPTS = 3;

export type PeerConnection = {
  did: string;
  peer: SimplePeer.Instance;
  streams: MediaStream[];
  initiator: boolean;
};

type AgentWithProfile = AgentState & Profile;

export const useWebrtcStore = defineStore(
  "webrtcStore",
  () => {
    const route = useRoute();
    const appStore = useAppStore();
    const uiStore = useUiStore();
    const mediaDevicesStore = useMediaDevicesStore();
    const communityServiceStore = useCommunityServiceStore();

    const { me } = storeToRefs(appStore);
    const { stream: localStream } = storeToRefs(mediaDevicesStore);
    const { getCommunityService } = communityServiceStore;

    // Call state
    const joiningCall = ref(false);
    const inCall = ref(false);
    const callRoute = ref<RouteParams>(route.params);
    const communityService = computed(() => getCommunityService(callRoute.value.communityId || ""));
    const signallingService = computed(() => communityService.value?.signallingService);
    const agentsInCommunity = computed<Record<string, AgentState>>(() => signallingService.value?.agents || {});
    const agentsInCall = ref<AgentWithProfile[]>([]);
    const callHealth = ref<CallHealth>("healthy");
    const callCommunityName = computed(
      () => (communityService.value?.community as unknown as Community)?.name || "No community name"
    );
    const callChannelName = computed(() => {
      const callChannel = (communityService.value?.channels as any)?.find(
        (c: Channel) => c.baseExpression === callRoute.value.channelId
      );
      return callChannel?.name || "No channel name";
    });

    // Connection state
    const peerConnections = ref<Map<string, PeerConnection>>(new Map());
    const myAgentStatus = ref<AgentStatus>("active");
    const reconnectionAttempts = ref<Record<string, number>>({});
    const reconnectionTimeouts = ref<Record<string, NodeJS.Timeout>>({});

    const iceServers = ref(defaultIceServers);
    let healthCheckInterval: NodeJS.Timeout | null = null;

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

      const peer = new SimplePeer({
        initiator,
        stream: localStream.value || undefined,
        config: { iceServers: iceServers.value },
      });

      peer.on("signal", (data) => {
        // Forward signal data through through the signalling service
        if (!signallingService.value) return;
        signallingService.value.sendSignal({ source: did, predicate: WEBRTC_SIGNAL, target: JSON.stringify(data) });
      });

      peer.on("connect", () => console.log(`Connected to peer ${did}`));

      peer.on("track", (track, stream) => {
        console.log(`Received ${track.kind} track from peer ${did}:`, {
          trackId: track.id,
          streamId: stream.id,
          enabled: track.enabled,
          readyState: track.readyState,
          trackCount: stream.getTracks().length,
        });

        // Find the peer connection
        const peerConnection = peerConnections.value.get(did);
        if (!peerConnection) {
          console.warn(`Received track from ${did} but no peer connection exists`);
          return;
        }

        // Check if we already have the stream & update or add accordingly
        const existingStreamIndex = peerConnection.streams.findIndex((s) => s.id === stream.id);
        if (existingStreamIndex >= 0) peerConnection.streams[existingStreamIndex] = stream;
        else peerConnection.streams.push(stream);

        // Monitor the track for debugging
        track.onended = () => console.log(`Track ${track.id} ended from peer ${did}`);
        track.onmute = () => console.log(`Track ${track.id} from ${did} muted`);
        track.onunmute = () => console.log(`Track ${track.id} from ${did} unmuted`);
      });

      // Could be used for direct webrtc signalling if needed in the future
      // peer.on("data", (data) => {});

      peer.on("close", () => {
        console.log(`Connection closed with peer ${did}`);
        cleanupPeerConnection(did);
      });

      peer.on("error", (err) => {
        console.error(`Error in connection with peer ${did}:`, err);
        cleanupPeerConnection(did);
      });

      peer.on("iceStateChange", (state) => {
        console.log(`ICE state change for ${did}: ${state}`);

        // Handle disconnection states
        if (state === "disconnected" || state === "failed") {
          // Clear any existing reconnection timeout for this peer
          if (reconnectionTimeouts.value[did]) {
            clearTimeout(reconnectionTimeouts.value[did]);
          }

          // Get current attempts or initialize
          const attempts = reconnectionAttempts.value[did] || 0;

          if (attempts < MAX_RECONNECTION_ATTEMPTS) {
            // Increment attempt counter
            reconnectionAttempts.value[did] = attempts + 1;

            // Use exponential backoff for retry timing
            const delay = Math.min(1000 * Math.pow(2, attempts), 10000); // 1s, 2s, 4s, 8s, max 10s

            console.log(
              `ICE connection ${state} for ${did}. Attempting reconnection ${attempts + 1}/${MAX_RECONNECTION_ATTEMPTS} in ${delay}ms`
            );

            // Set timeout for reconnection
            reconnectionTimeouts.value[did] = setTimeout(() => {
              if (!inCall.value) return; // Don't reconnect if we've left the call

              console.log(`Attempting to reconnect to ${did}...`);

              // Get the connection details
              const existingConnection = peerConnections.value.get(did);
              if (existingConnection) {
                const wasInitiator = existingConnection.initiator;

                // Clean up the existing connection
                cleanupPeerConnection(did);

                // Create a new connection with the same initiator status
                createPeerConnection(did, wasInitiator);
              }
            }, delay);
          } else {
            console.log(`ICE connection ${state} for ${did}. Max reconnection attempts reached.`);

            // Notify the user
            appStore.showDangerToast({ message: "Connection to user lost after multiple attempts" });

            // Clean up the connection
            cleanupPeerConnection(did);

            // Reset the counter for future attempts
            delete reconnectionAttempts.value[did];
          }
        } else if (state === "connected" || state === "completed") {
          // Connection is good, reset attempt counter
          if (reconnectionAttempts.value[did]) {
            console.log(`ICE connection restored to ${did} after ${reconnectionAttempts.value[did]} attempts`);
            delete reconnectionAttempts.value[did];
          }

          // Clear any pending reconnection attempts
          if (reconnectionTimeouts.value[did]) {
            clearTimeout(reconnectionTimeouts.value[did]);
            delete reconnectionTimeouts.value[did];
          }
        }
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

    function updatePeersWithNewStream(newStream: MediaStream, oldStream: MediaStream) {
      peerConnections.value.forEach((peerConnection, did) => {
        try {
          // Remove old tracks
          oldStream.getTracks().forEach((track) => peerConnection.peer.removeTrack(track, oldStream));

          // Add new tracks
          newStream.getTracks().forEach((track) => peerConnection.peer.addTrack(track, newStream));

          console.log(`Stream update complete for peer ${did}`);
        } catch (error) {
          console.error(`Error updating tracks for peer ${did}:`, error);

          // Fall back to recreating the peer if track replacement fails
          console.log(`Falling back to recreating peer connection for ${did}`);
          peerConnection.peer.destroy();
          createPeerConnection(did, peerConnection.initiator);
        }
      });
    }

    function webrtcSignalHandler(signal: PerspectiveExpression) {
      const link = signal.data.links[0];
      if (!link || link.author === me.value.did) return;

      const { author, data } = link;
      const { source, predicate, target } = data;

      if (predicate === WEBRTC_SIGNAL && target === me.value.did) {
        try {
          // Skip if we're not in a call
          if (!inCall.value) {
            console.debug(`Ignoring signal from ${author} - not in a call`);
            return;
          }

          // Parse the signal data
          const signalData = JSON.parse(source);
          if (!signalData || typeof signalData !== "object") {
            console.warn(`Invalid signal data from ${author}`);
            return;
          }

          // Find or create peer connection
          let peer: SimplePeer.Instance;
          const existingConnection = peerConnections.value.get(author);

          if (existingConnection) {
            peer = existingConnection.peer;
            console.log(`Processing signal for existing peer ${author}`);
          } else {
            console.log(`Creating new peer connection for ${author} (receiver)`);
            peer = createPeerConnection(author, false);
          }

          // Process the signal
          peer.signal(signalData);
        } catch (e) {
          console.error(`Error handling WebRTC signal from ${author}:`, e);
          cleanupPeerConnection(author);
        }
      }
    }

    async function joinRoom() {
      joiningCall.value = true;

      try {
        callRoute.value = route.params;

        // Add the signal handler to the signalling service
        signallingService.value?.addSignalHandler(webrtcSignalHandler);

        // Establish connections with the agents in the call
        if (agentsInCall.value.length > 0) {
          console.log("Connecting to agents in call:", agentsInCall.value);
          agentsInCall.value.forEach((agent) => {
            if (agent.did !== me.value.did) {
              console.log(`Creating peer connection for agent ${agent.did}`);
              // Create initiator connections to all peers alphabetically "less than" our did (prevents both sides from being initiators)
              const shouldInitiate = me.value.did.localeCompare(agent.did) > 0;
              createPeerConnection(agent.did, shouldInitiate);
            }
          });
        }

        inCall.value = true;
      } catch (error) {
        console.error("Error joining call:", error);
        callRoute.value = {};
      } finally {
        joiningCall.value = false;
      }
    }

    async function leaveRoom() {
      try {
        // Close all peer connections
        peerConnections.value.forEach((peer, did) => cleanupPeerConnection(did));

        // Remove the signal handler to the signalling service
        signallingService.value?.removeSignalHandler(webrtcSignalHandler);

        // Release media devices
        mediaDevicesStore.stopTracks();

        // Reset state
        inCall.value = false;
        callRoute.value = {};

        // Close the call window
        uiStore.setCallWindowOpen(false);
      } catch (error) {
        console.error("Error leaving call:", error);
      }
    }

    // Watch for route param changes
    watch(
      () => route.params,
      async (newParams) => {
        if (!inCall.value) {
          if (newParams.channelId) {
            // Update the call route
            callRoute.value = newParams;
          } else {
            // Close the call window
            uiStore.setCallWindowOpen(false);
          }
        }
      },
      { immediate: true }
    );

    // Watch for media stream changes to update peer connections
    watch(localStream, (newStream, oldStream) => {
      if (inCall.value && newStream && oldStream) updatePeersWithNewStream(newStream, oldStream);
    });

    // Update agentsInCall when the agents map in the signalling service changes
    watch(
      agentsInCommunity,
      async (newAgents) => {
        const agentsInCallMap = Object.entries(newAgents).filter(
          ([_, agent]) => agent.inCall && agent.callRoute.channelId === callRoute.value.channelId
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
        if (!inCall.value) return;

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
      inCall,
      (nowInCall) => {
        // If in a call, start the health check interval
        if (nowInCall) healthCheckInterval = setInterval(checkCallHealth, CALL_HEALTH_CHECK_INTERVAL);
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
      if (inCall.value) leaveRoom();
    });

    return {
      // Call state
      inCall,
      callRoute,
      myAgentStatus,
      agentsInCall,
      callHealth,
      callCommunityName,
      callChannelName,

      // WebRTC state
      peerConnections,
      joiningCall,

      // Actions
      joinRoom,
      leaveRoom,
    };
  },
  { persist: false }
);
