import guitarWav from "@/assets/audio/guitar.wav";
import kissWav from "@/assets/audio/kiss.wav";
import pigWav from "@/assets/audio/pig.wav";
import popWav from "@/assets/audio/pop.wav";
import { HEARTBEAT_INTERVAL } from "@/composables/useSignallingService";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { PerspectiveExpression } from "@coasys/ad4m";
import { Channel, Community } from "@coasys/flux-api";
import { AgentState, AgentStatus, CallHealth, Profile, RouteParams } from "@coasys/flux-types";
import { Howl } from "howler";
import { defineStore, storeToRefs } from "pinia";
import type { Instance } from "simple-peer";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "./appStore";
import { useCommunityServiceStore } from "./communityServiceStore";
import { useMediaDevicesStore } from "./mediaDevicesStore";
import { useUiStore } from "./uiStore";
// @ts-ignore
import SimplePeer from "simple-peer/simplepeer.min.js";

export const CALL_HEALTH_CHECK_INTERVAL = 6000;
export const WEBRTC_SIGNAL = "webrtc/signal";
export const WEBRTC_STREAM_REQUEST = "webrtc/stream-request";
export const WEBRTC_EMOJI = "webrtc/emoji";
export const WEBRTC_MEDIA_SETTINGS_CHANGED = "webrtc/media-settings-changed";
export const WEBRTC_LEAVING_CALL = "webrtc/leaving-call";
const MAX_RECONNECTION_ATTEMPTS = 3;
const defaultIceServers = [
  {
    urls: "stun:relay.ad4m.dev:3478",
    username: "openrelay",
    credential: "openrelay",
  },
  {
    urls: "turn:relay.ad4m.dev:443",
    username: "openrelay",
    credential: "openrelay",
  },
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: "stun:global.stun.twilio.com:3478",
  },
] as IceServer[];

export type IceServer = { urls: string; username?: string; credential?: string };
export type MediaState = "on" | "off" | "loading";
export type PeerConnection = {
  did: string;
  peer: SimplePeer.Instance;
  streams: MediaStream[];
  initiator: boolean;
  streamReady: boolean;
  audioState: MediaState;
  videoState: MediaState;
  screenShareState: MediaState;
  loadingChecks: Map<string, NodeJS.Timeout>;
};
export type AgentWithProfile = AgentState & Profile;
export type CallEmoji = { id: string; author: string; emoji: string };

export const useWebrtcStore = defineStore(
  "webrtcStore",
  () => {
    const route = useRoute();
    const appStore = useAppStore();
    const uiStore = useUiStore();
    const mediaDevicesStore = useMediaDevicesStore();
    const communityServiceStore = useCommunityServiceStore();

    const { me } = storeToRefs(appStore);
    const { stream: localStream, mediaSettings } = storeToRefs(mediaDevicesStore);
    const { getCommunityService } = communityServiceStore;

    const popSound = new Howl({ src: [popWav] });
    const guitarSound = new Howl({ src: [guitarWav] });
    const kissSound = new Howl({ src: [kissWav] });
    const pigSound = new Howl({ src: [pigWav] });

    const joiningCall = ref(false);
    const inCall = ref(false);
    const callRoute = ref<RouteParams>(route.params);
    const agentsInCall = ref<AgentWithProfile[]>([]);
    const callHealth = ref<CallHealth>("healthy");
    const callEmojis = ref<CallEmoji[]>([]);
    const peerConnections = ref<Map<string, PeerConnection>>(new Map());
    const myAgentStatus = ref<AgentStatus>("active");
    const reconnectionAttempts = ref<Record<string, number>>({});
    const reconnectionTimeouts = ref<Record<string, NodeJS.Timeout>>({});
    const iceServers = ref(defaultIceServers);
    const disconnectedAgents = ref<string[]>([]);

    const communityService = computed(() => getCommunityService(callRoute.value.communityId || ""));
    const signallingService = computed(() => communityService.value?.signallingService);
    const agentsInCommunity = computed<Record<string, AgentState>>(() => signallingService.value?.agents || {});
    // TODO: Get these when call window is opened instead to avoid complex computed properties?
    const callCommunityName = computed(
      () => (communityService.value?.community as unknown as Community)?.name || "No community name"
    );
    const callChannelName = computed(() => {
      const callChannel = (communityService.value?.channels as any)?.find(
        (c: Channel) => c.baseExpression === callRoute.value.channelId
      );
      return callChannel?.name || "No channel name";
    });

    let healthCheckInterval: NodeJS.Timeout | null = null;

    function signalAgent(did: string, predicate: string, data?: any): void {
      // Signals a specific agent via the holochain signalling service
      const source = data ? JSON.stringify(data) : "";
      signallingService.value?.sendSignal({ source, predicate, target: JSON.stringify([did]) });
    }

    function signalAgentsInCall(predicate: string, data: any): void {
      // Signals all agents currently in the call via the holochain signalling service
      const target = JSON.stringify(agentsInCall.value.map((agent) => agent.did));
      signallingService.value?.sendSignal({ source: JSON.stringify(data), predicate, target });
    }

    function signalPeers(type: string, data?: any): void {
      // Signals all connected peers via their WebRTC data channels
      const signal = JSON.stringify({ type, data: data || {} });
      peerConnections.value.forEach((connection, did) => {
        try {
          if (connection.peer._channel?.readyState === "open") connection.peer.send(signal);
        } catch (error) {
          console.error(`Failed to send media signal to ${did}:`, error);
        }
      });
    }

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

    function startLoadingCheck(mediaType: "audio" | "video" | "screenshare", peer: PeerConnection): void {
      // Polls for expected tracks after peer media changes because track replacement doesn't trigger an event we can listen for
      const interval = 500; // Check every 500ms
      const maxAttempts = 20; // Give up after 20 attempts (10 seconds with 500ms intervals)

      // Clear previous loading check if it exists
      const existingCheck = peer.loadingChecks.get(mediaType);
      if (existingCheck) clearInterval(existingCheck);

      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;

        const stream = peer.streams[0];
        if (!stream) return;

        let hasMedia = false;

        // Look for the expected media track in the stream
        switch (mediaType) {
          case "audio":
            hasMedia = stream.getAudioTracks().length > 0;
            break;
          case "video":
            hasMedia = stream.getVideoTracks().some((track) => track.enabled);
            break;
          case "screenshare":
            hasMedia = stream.getVideoTracks().some((track) => track.enabled);
            break;
        }

        if (hasMedia || attempts >= maxAttempts) {
          console.log(
            `🔄 Loading check finished for ${mediaType} track for peer ${peer.did}: attempt ${attempts}, hasMedia: ${hasMedia}`
          );

          // Update the media state
          if (mediaType === "audio") peer.audioState = hasMedia ? "on" : "off";
          else if (mediaType === "video") peer.videoState = hasMedia ? "on" : "off";
          else if (mediaType === "screenshare") peer.screenShareState = hasMedia ? "on" : "off";

          clearInterval(checkInterval);
          peer.loadingChecks.delete(mediaType);

          if (hasMedia) console.log(`✅ ${mediaType} loaded for peer ${peer.did}`);
          else console.warn(`❌ ${mediaType} failed to load for peer ${peer.did} after ${maxAttempts} attempts`);
        }
      }, interval);

      peer.loadingChecks.set(mediaType, checkInterval);
    }

    function createPeerConnection(did: string, initiator: boolean): SimplePeer.Instance {
      console.log(`🌐 Creating peer connection for ${did} (initiator: ${initiator})`);

      // Check if we already have a connection for this peer
      const existingPeer = peerConnections.value.get(did);
      if (existingPeer) {
        existingPeer.peer.destroy();
        peerConnections.value.delete(did);
      }

      // Create a new SimplePeer instance
      const peer = new SimplePeer({
        initiator,
        stream: localStream.value || undefined,
        config: { iceServers: iceServers.value },
        trickle: true,
      }) as Instance;

      // Handle peer events
      peer.on("signal", (data) => signalAgent(did, WEBRTC_SIGNAL, data));

      peer.on("connect", () => {
        console.log(`✅ Peer connection established with ${did}`);

        // Set initial media settings for peer from their agent state in the signalling service (updated later via direct webrtc signals)
        const peerConnection = peerConnections.value.get(did);
        const agent = agentsInCall.value.find((a) => a.did === did);
        if (peerConnection && agent) {
          peerConnection.audioState = agent.mediaSettings.audioEnabled ? "on" : "off";
          peerConnection.videoState = agent.mediaSettings.videoEnabled ? "on" : "off";
          peerConnection.screenShareState = agent.mediaSettings.screenShareEnabled ? "on" : "off";
        }

        // // If no stream found after connection established, request it from the peer
        // setTimeout(() => {
        //   const peerConnection = peerConnections.value.get(did);
        //   if (peerConnection && !peerConnection.streams.length) signalAgent(did, WEBRTC_STREAM_REQUEST);
        // }, 1000);
      });

      peer.on("data", (signal) => {
        let parsedSignal;
        try {
          parsedSignal = JSON.parse(signal);
        } catch (error) {
          console.error(`Invalid JSON from peer ${did}:`, error);
          return;
        }

        const { type, data } = parsedSignal;

        if (type === WEBRTC_MEDIA_SETTINGS_CHANGED) {
          console.log(`Received media settings change from ${did}:`, data);

          // Find the peer
          const peer = peerConnections.value.get(did);
          if (!peer) return;

          // Update their media state and start loading checks if necessary
          if (data.type === "audio") {
            peer.audioState = data.enabled ? "loading" : "off";
            if (data.enabled) startLoadingCheck("audio", peer);
          } else if (data.type === "video") {
            const existingVideoTrack = peer.streams[0].getVideoTracks().some((track) => track.enabled);
            // If toggling back on an existing video track or switching on video while screen sharing is enabled, skip the video loading state
            if (data.enabled && (existingVideoTrack || peer.screenShareState === "on")) {
              peer.videoState = "on";
            } else {
              // Otherwise handle normally
              peer.videoState = data.enabled ? "loading" : "off";
              if (data.enabled) startLoadingCheck("video", peer);
            }
          } else if (data.type === "screenShare") {
            peer.screenShareState = data.enabled ? "loading" : "off";
            if (data.enabled) startLoadingCheck("screenshare", peer);
          }

          console.log(`Peer ${did} updated media settings:`, data);
        }

        if (type === WEBRTC_LEAVING_CALL) {
          console.log(`Peer ${did} is leaving the call`);

          // Add the agents did to the disconnected agents list for a full HEARTBEAT_INTERVAL to avoid reconnection attempts until the signalling service is up to date
          disconnectedAgents.value.push(did);
          setTimeout(
            () => (disconnectedAgents.value = disconnectedAgents.value.filter((d) => d !== did)),
            HEARTBEAT_INTERVAL + 1000
          );

          // Clean up the peer connection
          cleanupPeerConnection(did);
          appStore.showDangerToast({ message: `${did} has left the call` });
        }
      });

      peer.on("track", (track, stream) => {
        console.log(`🎞️ New ${track.kind} track from ${did}`, track);

        // Find the peer connection
        const peerConnection = peerConnections.value.get(did);
        if (!peerConnection) return;

        // Check if we already have the stream & update or add accordingly
        const existingStreamIndex = peerConnection.streams.findIndex((s) => s.id === stream.id);
        if (existingStreamIndex >= 0) peerConnection.streams[existingStreamIndex] = stream;
        else peerConnection.streams = [stream];

        // Mark the stream as ready if not already set
        if (!peerConnection.streamReady) peerConnection.streamReady = true;
      });

      peer.on("close", () => cleanupPeerConnection(did));

      peer.on("error", () => cleanupPeerConnection(did));

      peer.on("iceStateChange", (state) => {
        // Handle disconnection states
        if (state === "disconnected" || state === "failed") {
          // Clear existing reconnection timeout for peer if present
          if (reconnectionTimeouts.value[did]) clearTimeout(reconnectionTimeouts.value[did]);

          // Get current attempts or initialize
          const attempts = reconnectionAttempts.value[did] || 0;

          if (attempts < MAX_RECONNECTION_ATTEMPTS) {
            console.warn(`🔄 Reconnection attempt ${attempts + 1} for peer ${did}`);

            // Increment attempt counter
            reconnectionAttempts.value[did] = attempts + 1;

            // Use exponential backoff for retry timing
            const delay = Math.min(1000 * Math.pow(2, attempts), 10000); // 1s, 2s, 4s, 8s, max 10s

            // Set timeout for reconnection
            reconnectionTimeouts.value[did] = setTimeout(() => {
              if (!inCall.value) return; // Don't reconnect if we've left the call

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
            // Notify the user
            appStore.showDangerToast({ message: "Connection to user lost after multiple attempts" });

            // Clean up the connection
            cleanupPeerConnection(did);

            // Reset the counter for future attempts
            delete reconnectionAttempts.value[did];
          }
        } else if (state === "connected" || state === "completed") {
          // Connection is good, reset attempt counter
          if (reconnectionAttempts.value[did]) delete reconnectionAttempts.value[did];

          // Clear any pending reconnection attempts
          if (reconnectionTimeouts.value[did]) {
            clearTimeout(reconnectionTimeouts.value[did]);
            delete reconnectionTimeouts.value[did];
          }
        }
      });

      // Store the peer connection
      peerConnections.value.set(did, {
        did,
        peer,
        streams: [],
        initiator,
        streamReady: false,
        audioState: "on",
        videoState: "off",
        screenShareState: "off",
        loadingChecks: new Map<string, NodeJS.Timeout>(),
      });

      return peer;
    }

    function cleanupPeerConnection(did: string) {
      const peerConnection = peerConnections.value.get(did);
      if (!peerConnection) return;

      console.log(`🗑️ Cleaning up peer connection for ${did}`);

      try {
        // Clear any loading check intervals
        peerConnection.loadingChecks.forEach((interval) => clearInterval(interval));
        peerConnection.loadingChecks.clear();

        // Destory their connection
        peerConnection.peer.destroy();
      } catch (e) {
        console.error(`Error destroying peer ${did}:`, e);
      }

      // Remove their entry from the peerConnections map
      peerConnections.value.delete(did);
    }

    async function addTrack(newTrack: MediaStreamTrack, stream: MediaStream) {
      if (!inCall.value) return;

      console.log(`➕ Adding ${newTrack.kind} track for all peers`);

      for (const [did, peerConnection] of peerConnections.value) {
        try {
          peerConnection.peer.addTrack(newTrack, stream);
          console.log(`✅ Added ${newTrack.kind} track for peer ${did}`);
        } catch (error) {
          console.error(`❌ Failed to add ${newTrack.kind} track for peer ${did}:`, error);
        }
      }
    }

    async function removeTrack(trackToRemove: MediaStreamTrack) {
      if (!inCall.value) return;

      console.log(`🗑️ Removing ${trackToRemove.kind} track for all peers`);

      for (const [did, peerConnection] of peerConnections.value) {
        try {
          const pc = peerConnection.peer._pc;
          const senders = pc.getSenders();

          // Find sender for the track and replace with null (removes it)
          const sender = senders.find((s: any) => s.track === trackToRemove);
          if (sender) {
            await sender.replaceTrack(null);
            console.log(`✅ Removed ${trackToRemove.kind} track for peer ${did}`);
          }
        } catch (error) {
          console.error(`❌ Failed to remove ${trackToRemove.kind} track for peer ${did}:`, error);
        }
      }
    }

    async function replaceAudioTrack(newTrack: MediaStreamTrack, oldTrack?: MediaStreamTrack) {
      if (!inCall.value) return;

      console.log("🎤 Replacing audio track for all peers");

      const updatePromises = Array.from(peerConnections.value.entries()).map(async ([did, peerConnection]) => {
        try {
          const pc = peerConnection.peer._pc;
          const senders = pc.getSenders();

          if (oldTrack) {
            // Find sender for old track and replace it
            const audioSender = senders.find((s: any) => s.track === oldTrack);
            if (audioSender) {
              await audioSender.replaceTrack(newTrack);
              console.log(`✅ Replaced audio track for peer ${did}`);
              return;
            }
          }

          // If no old track or sender not found, add new track
          peerConnection.peer.addTrack(newTrack, localStream.value!);
          console.log(`➕ Added new audio track for peer ${did}`);
        } catch (error) {
          console.error(`❌ Failed to replace audio track for peer ${did}:`, error);
        }
      });

      // Wait for all peer updates to complete
      await Promise.all(updatePromises);
      console.log("🎉 Finished updating audio tracks for all peers");
    }

    async function replaceVideoTrack(newTrack: MediaStreamTrack, oldTrack?: MediaStreamTrack) {
      if (!inCall.value) return;

      console.log("📹 Replacing video track for all peers", newTrack);

      const updatePromises = Array.from(peerConnections.value.entries()).map(async ([did, peerConnection]) => {
        try {
          const pc = peerConnection.peer._pc;
          const senders = pc.getSenders();

          if (oldTrack) {
            // Find sender for old track and replace it
            const videoSender = senders.find((s: any) => s.track === oldTrack);
            if (videoSender) {
              await videoSender.replaceTrack(newTrack);
              console.log(`✅ Replaced video track for peer ${did}`);
              return;
            }
          }

          // If no old track or sender not found, add new track
          peerConnection.peer.addTrack(newTrack, localStream.value!);
          console.log(`➕ Added new video track for peer ${did}`);
        } catch (error) {
          console.error(`❌ Failed to replace video track for peer ${did}:`, error);
        }
      });

      // Wait for all peer updates to complete
      await Promise.all(updatePromises);
      console.log("🎉 Finished updating video tracks for all peers");
    }

    function displayEmoji(emoji: string, author: string) {
      // Push the emoji to the call emojis array so it can be displayed in the UI
      const emojiId = crypto.randomUUID();
      callEmojis.value.push({ id: emojiId, author, emoji });

      // Play the emoji sound
      if (emoji === "💋" || emoji === "😘") kissSound.play();
      else if (emoji === "🎸") guitarSound.play();
      else if (emoji === "🐷" || emoji === "🐖") pigSound.play();
      else popSound.play();

      // Remove the emoji after a timeout
      setTimeout(() => (callEmojis.value = callEmojis.value.filter((emoji) => emoji.id !== emojiId)), 3500);
    }

    function webrtcSignalHandler(signal: PerspectiveExpression) {
      // Listens for signals in the holochain signalling service used by the webRTC store
      const link = signal.data.links[0];
      if (!inCall.value || !link) return;

      const { author, data } = link;
      const { source, predicate, target } = data;

      if (predicate === WEBRTC_SIGNAL && link.author !== me.value.did) {
        try {
          // Parse the signal data
          const signalData = JSON.parse(source);
          const recipients = JSON.parse(target) as string[];
          if (!signalData || typeof signalData !== "object" || !recipients.includes(me.value.did)) return;

          // Find or create peer connection
          let peer: SimplePeer.Instance;
          const existingConnection = peerConnections.value.get(author);

          if (existingConnection) peer = existingConnection.peer;
          else peer = createPeerConnection(author, false);

          // Handle the signal data
          peer.signal(signalData);
        } catch (e) {
          console.error(`❌ Error handling WebRTC signal from ${author}:`, e);
          cleanupPeerConnection(author);
        }
      }

      if (predicate === WEBRTC_STREAM_REQUEST && link.author !== me.value.did) {
        // Handle stream request from peer
        try {
          const recipients = JSON.parse(target) as string[];
          const peerConnection = peerConnections.value.get(author);
          if (!localStream.value || !peerConnection || !recipients.includes(me.value.did)) return;

          // Add local stream tracks to the peer connection
          localStream.value.getTracks().forEach((track) => peerConnection.peer.addTrack(track, localStream.value));
        } catch (e) {
          console.error(`❌ Error handling WebRTC stream request from ${author}:`, e);
        }
      }

      if (predicate === WEBRTC_EMOJI) {
        // Handle emoji reaction from peer
        try {
          const recipients = JSON.parse(target) as string[];
          if (!recipients.includes(me.value.did)) return;

          const emoji = JSON.parse(source);
          displayEmoji(emoji, author);
        } catch (e) {
          console.error(`❌ Error handling WebRTC emoji from ${author}:`, e);
        }
      }
    }

    function addIceServer(newIceServer: IceServer) {
      iceServers.value = [...iceServers.value, newIceServer];
    }

    function removeIceServer(url: string) {
      iceServers.value = iceServers.value.filter((server) => server.urls !== url);
    }

    function resetIceServers() {
      iceServers.value = defaultIceServers;
    }

    async function joinRoom() {
      joiningCall.value = true;

      try {
        // Update the call route
        callRoute.value = route.params;

        // Add the webrtc signal handler to the signalling service
        signallingService.value?.addSignalHandler(webrtcSignalHandler);

        // Establish connections with the agents in the call
        if (agentsInCall.value.length > 0) {
          agentsInCall.value.forEach((agent) => {
            if (agent.did === me.value.did) return;

            // Create initiator connections to all peers alphabetically "less than" our did (prevents both sides from being initiators)
            const shouldInitiate = me.value.did.localeCompare(agent.did) > 0;
            createPeerConnection(agent.did, shouldInitiate);
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
        // Signal all peers that we're leaving the call
        signalPeers(WEBRTC_LEAVING_CALL);

        // Close all peer connections
        peerConnections.value.forEach((_, did) => cleanupPeerConnection(did));

        // Remove the webrtc signal handler from the signalling service
        signallingService.value?.removeSignalHandler(webrtcSignalHandler);

        // Release media devices
        mediaDevicesStore.resetMediaDevices();

        // Reset state
        inCall.value = false;
        callRoute.value = {};

        // Close the call window
        uiStore.setCallWindowOpen(false);
      } catch (error) {
        console.error("Error leaving call:", error);
      }
    }

    // Update the call route or close call window on route param changes if not already in a call
    watch(
      () => route.params,
      async (newParams) => {
        // Skip if we're already in a call
        if (inCall.value) return;

        // If channel id present in the params update the call route
        if (newParams.channelId) callRoute.value = newParams;
        // Otherwise, close the call window
        else uiStore.setCallWindowOpen(false);
      }
    );

    // Check for updates to agentsInCall when agentsInCommunity changes
    watch(
      agentsInCommunity,
      async (newAgents) => {
        const agentsInCallMap = Object.entries(newAgents).filter(
          ([_, agent]) => agent.inCall && agent.callRoute.channelId === callRoute.value.channelId
        );
        // Merge the agent states with their profiles
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
          // Skip ourselves
          if (agent.did === me.value.did) return;

          // Skip if we already have a connection with this agent
          if (peerConnections.value.has(agent.did)) return;

          // Skip if the agent has just disconnected in the last HEARTBEAT_INTERVAL
          if (disconnectedAgents.value.includes(agent.did)) return;

          // Create a new peer connection
          const shouldInitiate = me.value.did.localeCompare(agent.did) > 0;
          createPeerConnection(agent.did, shouldInitiate);
        });

        // Remove agents that left the call or are no longer active
        existingPeerDids.forEach((did) => {
          if (!newAgents.map((a) => a.did).includes(did)) cleanupPeerConnection(did);
        });
      },
      { deep: true }
    );

    // Signal media changes directly to peers via webrtc data channel to avoid delay with holochain signalling
    watch(
      mediaSettings,
      (newSettings, oldSettings) => {
        if (!inCall.value || !newSettings || !oldSettings) return;

        if (newSettings.audioEnabled !== oldSettings.audioEnabled) {
          signalPeers(WEBRTC_MEDIA_SETTINGS_CHANGED, { type: "audio", enabled: newSettings.audioEnabled });
        }

        if (newSettings.videoEnabled !== oldSettings.videoEnabled) {
          signalPeers(WEBRTC_MEDIA_SETTINGS_CHANGED, { type: "video", enabled: newSettings.videoEnabled });
        }

        if (newSettings.screenShareEnabled !== oldSettings.screenShareEnabled) {
          signalPeers(WEBRTC_MEDIA_SETTINGS_CHANGED, { type: "screenShare", enabled: newSettings.screenShareEnabled });
        }
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

    return {
      inCall,
      callRoute,
      myAgentStatus,
      agentsInCall,
      callHealth,
      callEmojis,
      communityService,
      callCommunityName,
      callChannelName,
      peerConnections,
      joiningCall,
      iceServers,
      disconnectedAgents,
      addTrack,
      removeTrack,
      replaceAudioTrack,
      replaceVideoTrack,
      addIceServer,
      removeIceServer,
      resetIceServers,
      joinRoom,
      leaveRoom,
      signalAgent,
      signalAgentsInCall,
      displayEmoji,
    };
  },
  { persist: false }
);
