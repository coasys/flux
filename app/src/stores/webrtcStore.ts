import guitarWav from '@/assets/audio/guitar.wav';
import kissWav from '@/assets/audio/kiss.wav';
import pigWav from '@/assets/audio/pig.wav';
import popWav from '@/assets/audio/pop.wav';
import { HEARTBEAT_INTERVAL } from '@/composables/useSignallingService';
import { useTabCoordinator } from '@/composables/useTabCoordinator';
import { getCachedAgentProfile } from '@/utils/userProfileCache';
import { dedupeByDid, sessionKey, shouldInitiate } from '@/utils/callSessions';
import { PerspectiveExpression } from '@coasys/ad4m';
import { getDefaultIceServers, IceServer } from '@coasys/flux-utils';
import { AgentState, AgentStatus, CallHealth, Profile, RouteParams } from '@coasys/flux-types';
import { Howl } from 'howler';
import { defineStore, storeToRefs } from 'pinia';
import type { Instance } from 'simple-peer';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from './appStore';
import { useCommunityServiceStore } from './communityServiceStore';
import { useMediaDevicesStore } from './mediaDevicesStore';
import { useUiStore } from './uiStore';
// @ts-ignore
import SimplePeer from 'simple-peer/simplepeer.min.js';
import { restoreNeighbourhoodPrefix } from '@/utils/routeUtils';

export const CALL_HEALTH_CHECK_INTERVAL = 6000;
export const WEBRTC_SIGNAL = 'webrtc/signal';
export const WEBRTC_STREAM_REQUEST = 'webrtc/stream-request';
export const WEBRTC_EMOJI = 'webrtc/emoji';
export const WEBRTC_MEDIA_SETTINGS_CHANGED = 'webrtc/media-settings-changed';
export const WEBRTC_LEAVING_CALL = 'webrtc/leaving-call';
const MAX_RECONNECTION_ATTEMPTS = 3;

export type MediaState = 'on' | 'off' | 'loading';
export type PeerConnection = {
  did: string;
  // The remote session this connection belongs to. A single agent (did) can be
  // in the call from several sessions (tabs/devices), each its own peer.
  sessionId: string;
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
// A call participant at session granularity — `sessionKey` (`did::sessionId`)
// is the unit peers and presence are keyed by.
export type CallSession = AgentWithProfile & { sessionKey: string };
export type CallEmoji = { id: string; author: string; emoji: string };

export const useWebrtcStore = defineStore(
  'webrtcStore',
  () => {
    const route = useRoute();
    const appStore = useAppStore();
    const uiStore = useUiStore();
    const mediaDevicesStore = useMediaDevicesStore();
    const communityServiceStore = useCommunityServiceStore();
    const { me } = storeToRefs(appStore);
    const { stream: localStream, mediaSettings } = storeToRefs(mediaDevicesStore);
    const { getCommunityService } = communityServiceStore;

    const tabCoordinator = useTabCoordinator();

    // This tab/device's stable session id. Shared with the tab coordinator and
    // the signalling service so the same agent can be in a call from several
    // sessions at once, each tracked independently.
    const mySessionId = tabCoordinator.tabId;
    const mySessionKey = computed(() => sessionKey(me.value.did, mySessionId));

    const popSound = new Howl({ src: [popWav] });
    const guitarSound = new Howl({ src: [guitarWav] });
    const kissSound = new Howl({ src: [kissWav] });
    const pigSound = new Howl({ src: [pigWav] });

    const joiningCall = ref(false);
    const inCall = ref(false);
    const callRoute = ref<RouteParams>({});
    // Every session in the call (one entry per tab/device). Drives peer
    // connections and signalling.
    const callSessions = ref<CallSession[]>([]);
    // One entry per person, for identity UI (avatar groups, "N agents in call").
    const agentsInCall = computed<AgentWithProfile[]>(() => dedupeByDid(callSessions.value));
    const callHealth = ref<CallHealth>('healthy');
    const callEmojis = ref<CallEmoji[]>([]);
    const peerConnections = ref<Map<string, PeerConnection>>(new Map());
    const myAgentStatus = ref<AgentStatus>('active');
    const reconnectionAttempts = ref<Record<string, number>>({});
    const reconnectionTimeouts = ref<Record<string, NodeJS.Timeout>>({});
    const iceServers = ref<IceServer[]>(getDefaultIceServers());
    const disconnectedAgents = ref<string[]>([]);
    const hasCopiedLink = ref(false);
    let copyLinkTimer: ReturnType<typeof setTimeout> | null = null;

    const communityService = computed(() =>
      getCommunityService(restoreNeighbourhoodPrefix(callRoute.value.communityId || '')),
    );
    const signallingService = computed(() => communityService.value?.signallingService);
    const agentsInCommunity = computed<Record<string, AgentState>>(() => signallingService.value?.agents || {});

    let healthCheckInterval: NodeJS.Timeout | null = null;

    function signalAgent(did: string, predicate: string, data?: any): void {
      // Signals a specific agent via the holochain signalling service
      const source = data ? JSON.stringify(data) : '';
      signallingService.value?.sendSignal({ source, predicate, target: JSON.stringify([did]) });
    }

    function signalSession(sessionId: string, signalData: any): void {
      // WebRTC signalling is session-precise: it targets a specific session
      // (so two sessions of the same agent negotiate separately) and carries
      // our own session id so the receiver keys the peer by our session.
      const source = JSON.stringify({ signal: signalData, fromSessionId: mySessionId });
      signallingService.value?.sendSignal({ source, predicate: WEBRTC_SIGNAL, target: JSON.stringify([sessionId]) });
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
          if (connection.peer._channel?.readyState === 'open') connection.peer.send(signal);
        } catch (error) {
          console.error(`Failed to send media signal to ${did}:`, error);
        }
      });
    }

    function checkCallHealth(): void {
      // Check the last update time of each peer to determine if the call is healthy
      const now = Date.now();
      const { connectionsLost, warnings } = callSessions.value.reduce(
        (health, agent) => {
          if (agent.sessionKey === mySessionKey.value) return health;
          const timeSinceLastUpdate = now - agent.lastUpdate;
          if (timeSinceLastUpdate > CALL_HEALTH_CHECK_INTERVAL * 2) health.connectionsLost = true;
          else if (timeSinceLastUpdate > CALL_HEALTH_CHECK_INTERVAL) health.warnings = true;
          return health;
        },
        { connectionsLost: false, warnings: false },
      );
      const newCallHealth = connectionsLost ? 'connections-lost' : warnings ? 'warnings' : 'healthy';
      if (callHealth.value !== newCallHealth) callHealth.value = newCallHealth;
    }

    function startLoadingCheck(mediaType: 'audio' | 'video' | 'screenshare', peer: PeerConnection): void {
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
          case 'audio':
            hasMedia = stream.getAudioTracks().length > 0;
            break;
          case 'video':
            hasMedia = stream.getVideoTracks().some((track) => track.enabled);
            break;
          case 'screenshare':
            hasMedia = stream.getVideoTracks().some((track) => track.enabled);
            break;
        }

        if (hasMedia || attempts >= maxAttempts) {
          console.log(
            `🔄 Loading check finished for ${mediaType} track for peer ${peer.did}: attempt ${attempts}, hasMedia: ${hasMedia}`,
          );

          // Update the media state
          if (mediaType === 'audio') peer.audioState = hasMedia ? 'on' : 'off';
          else if (mediaType === 'video') peer.videoState = hasMedia ? 'on' : 'off';
          else if (mediaType === 'screenshare') peer.screenShareState = hasMedia ? 'on' : 'off';

          clearInterval(checkInterval);
          peer.loadingChecks.delete(mediaType);

          if (hasMedia) console.log(`✅ ${mediaType} loaded for peer ${peer.did}`);
          else console.warn(`❌ ${mediaType} failed to load for peer ${peer.did} after ${maxAttempts} attempts`);
        }
      }, interval);

      peer.loadingChecks.set(mediaType, checkInterval);
    }

    function createPeerConnection(did: string, sessionId: string, initiator: boolean): SimplePeer.Instance {
      const key = sessionKey(did, sessionId);
      console.log(`🌐 Creating peer connection for ${key} (initiator: ${initiator})`);

      // Check if we already have a connection for this session
      const existingPeer = peerConnections.value.get(key);
      if (existingPeer) {
        existingPeer.peer.destroy();
        peerConnections.value.delete(key);
      }

      // Create a new SimplePeer instance
      const peer = new SimplePeer({
        initiator,
        stream: localStream.value || undefined,
        config: { iceServers: iceServers.value },
        trickle: true,
      }) as Instance;

      // Handle peer events
      peer.on('signal', (data) => signalSession(sessionId, data));

      peer.on('connect', () => {
        console.log(`✅ Peer connection established with ${key}`);

        // Set initial media settings for peer from their session state in the signalling service (updated later via direct webrtc signals)
        const peerConnection = peerConnections.value.get(key);
        const agent = callSessions.value.find((a) => a.sessionKey === key);
        if (peerConnection && agent) {
          peerConnection.audioState = agent.mediaSettings.audioEnabled ? 'on' : 'off';
          peerConnection.videoState = agent.mediaSettings.videoEnabled ? 'on' : 'off';
          peerConnection.screenShareState = agent.mediaSettings.screenShareEnabled ? 'on' : 'off';
        }

        // // If no stream found after connection established, request it from the peer
        // setTimeout(() => {
        //   const peerConnection = peerConnections.value.get(did);
        //   if (peerConnection && !peerConnection.streams.length) signalAgent(did, WEBRTC_STREAM_REQUEST);
        // }, 1000);
      });

      peer.on('data', async (signal) => {
        let parsedSignal;
        try {
          parsedSignal = JSON.parse(signal);
        } catch (error) {
          console.error(`Invalid JSON from peer ${key}:`, error);
          return;
        }

        const { type, data } = parsedSignal;

        if (type === WEBRTC_MEDIA_SETTINGS_CHANGED) {
          console.log(`Received media settings change from ${key}:`, data);

          // Find the peer
          const peer = peerConnections.value.get(key);
          if (!peer) return;

          // Update their media state and start loading checks if necessary
          if (data.type === 'audio') {
            peer.audioState = data.enabled ? 'loading' : 'off';
            if (data.enabled) startLoadingCheck('audio', peer);
          } else if (data.type === 'video') {
            const existingVideoTrack = peer.streams[0].getVideoTracks().some((track) => track.enabled);
            // If toggling back on an existing video track or switching on video while screen sharing is enabled, skip the video loading state
            if (data.enabled && (existingVideoTrack || peer.screenShareState === 'on')) {
              peer.videoState = 'on';
            } else {
              // Otherwise handle normally
              peer.videoState = data.enabled ? 'loading' : 'off';
              if (data.enabled) startLoadingCheck('video', peer);
            }
          } else if (data.type === 'screenShare') {
            peer.screenShareState = data.enabled ? 'loading' : 'off';
            if (data.enabled) startLoadingCheck('screenshare', peer);
          }
        }

        if (type === WEBRTC_LEAVING_CALL) {
          console.log(`Peer ${key} is leaving the call`);

          // Add the session to the disconnected list for a full HEARTBEAT_INTERVAL to avoid reconnection attempts until the signalling service is up to date
          disconnectedAgents.value.push(key);
          setTimeout(
            () => (disconnectedAgents.value = disconnectedAgents.value.filter((d) => d !== key)),
            HEARTBEAT_INTERVAL + 1000,
          );

          // Clean up the peer connection
          cleanupPeerConnection(key);
          const peerProfile = await getCachedAgentProfile(did, appStore.ad4mClient);
          appStore.showDangerToast({ message: `👤 ${peerProfile.username || did} has left the call` });
        }
      });

      peer.on('track', (track, stream) => {
        console.log(`🎞️ New ${track.kind} track from ${key}`, track);

        // Find the peer connection
        const peerConnection = peerConnections.value.get(key);
        if (!peerConnection) return;

        // Append (don't overwrite) — a peer that's sharing their screen
        // sends both the camera stream and the screenshare stream, and the
        // old `streams = [stream]` shape silently dropped the camera tile
        // the moment the screenshare track arrived. New streams append;
        // tracks added to existing streams update in place.
        const existingStreamIndex = peerConnection.streams.findIndex((s) => s.id === stream.id);
        if (existingStreamIndex >= 0) peerConnection.streams[existingStreamIndex] = stream;
        else peerConnection.streams.push(stream);

        // Drop the stream from this peer's list as soon as all of its tracks
        // end — guards against stale screenshare tiles after the sender
        // stops sharing.  We can't rely on the peer connection's own
        // sender-removal because that fires before the receiving track ends.
        const onTrackEnded = () => {
          if (track.readyState !== 'ended') return;
          const pc = peerConnections.value.get(key);
          if (!pc) return;
          const streamRef = pc.streams.find((s) => s.id === stream.id);
          if (!streamRef) return;
          const liveTracks = streamRef.getTracks().filter((t) => t.readyState !== 'ended');
          if (liveTracks.length === 0) {
            pc.streams = pc.streams.filter((s) => s.id !== stream.id);
          }
        };
        track.addEventListener('ended', onTrackEnded);

        // Mark the stream as ready if not already set
        if (!peerConnection.streamReady) peerConnection.streamReady = true;
      });

      peer.on('close', () => cleanupPeerConnection(key));

      peer.on('error', () => cleanupPeerConnection(key));

      peer.on('iceStateChange', (state) => {
        // Handle disconnection states
        if (state === 'disconnected' || state === 'failed') {
          // Clear existing reconnection timeout for peer if present
          if (reconnectionTimeouts.value[key]) clearTimeout(reconnectionTimeouts.value[key]);

          // Get current attempts or initialize
          const attempts = reconnectionAttempts.value[key] || 0;

          if (attempts < MAX_RECONNECTION_ATTEMPTS) {
            console.warn(`🔄 Reconnection attempt ${attempts + 1} for peer ${key}`);

            // Increment attempt counter
            reconnectionAttempts.value[key] = attempts + 1;

            // Use exponential backoff for retry timing
            const delay = Math.min(1000 * Math.pow(2, attempts), 10000); // 1s, 2s, 4s, 8s, max 10s

            // Set timeout for reconnection
            reconnectionTimeouts.value[key] = setTimeout(() => {
              if (!inCall.value) return; // Don't reconnect if we've left the call

              // Get the connection details
              const existingConnection = peerConnections.value.get(key);
              if (existingConnection) {
                const wasInitiator = existingConnection.initiator;

                // Clean up the existing connection
                cleanupPeerConnection(key);

                // Create a new connection with the same initiator status
                createPeerConnection(did, sessionId, wasInitiator);
              }
            }, delay);
          } else {
            // Notify the user
            appStore.showDangerToast({ message: 'Connection to user lost after multiple attempts' });

            // Clean up the connection
            cleanupPeerConnection(key);

            // Reset the counter for future attempts
            delete reconnectionAttempts.value[key];
          }
        } else if (state === 'connected' || state === 'completed') {
          // Connection is good, reset attempt counter
          if (reconnectionAttempts.value[key]) delete reconnectionAttempts.value[key];

          // Clear any pending reconnection attempts
          if (reconnectionTimeouts.value[key]) {
            clearTimeout(reconnectionTimeouts.value[key]);
            delete reconnectionTimeouts.value[key];
          }
        }
      });

      // Store the peer connection
      peerConnections.value.set(key, {
        did,
        sessionId,
        peer,
        streams: [],
        initiator,
        streamReady: false,
        audioState: 'on',
        videoState: 'off',
        screenShareState: 'off',
        loadingChecks: new Map<string, NodeJS.Timeout>(),
      });

      return peer;
    }

    function cleanupPeerConnection(key: string) {
      const peerConnection = peerConnections.value.get(key);
      if (!peerConnection) return;

      console.log(`🗑️ Cleaning up peer connection for ${key}`);

      try {
        // Clear any loading check intervals
        peerConnection.loadingChecks.forEach((interval) => clearInterval(interval));
        peerConnection.loadingChecks.clear();

        // Destory their connection
        peerConnection.peer.destroy();
      } catch (e) {
        console.error(`Error destroying peer ${key}:`, e);
      }

      // Remove their entry from the peerConnections map
      peerConnections.value.delete(key);
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

    // Adds a screen-share track to every peer connection as part of a
    // dedicated MediaStream (rather than replacing the camera sender).
    // The receiving side's `peer.on('track')` then fires with a distinct
    // stream id and the per-peer streams array grows by one entry — the
    // remote UI gets a separate tile for the screenshare while keeping
    // the camera tile.
    async function addScreenShareTrack(track: MediaStreamTrack, screenShareStream: MediaStream) {
      if (!inCall.value) return;

      console.log('🖥️ Adding screen-share track for all peers');

      for (const [did, peerConnection] of peerConnections.value) {
        try {
          peerConnection.peer.addTrack(track, screenShareStream);
          console.log(`✅ Added screen-share track for peer ${did}`);
        } catch (error) {
          console.error(`❌ Failed to add screen-share track for peer ${did}:`, error);
        }
      }
    }

    async function replaceAudioTrack(newTrack: MediaStreamTrack, oldTrack?: MediaStreamTrack) {
      if (!inCall.value) return;

      console.log('🎤 Replacing audio track for all peers');

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
      console.log('🎉 Finished updating audio tracks for all peers');
    }

    async function replaceVideoTrack(newTrack: MediaStreamTrack, oldTrack?: MediaStreamTrack) {
      if (!inCall.value) return;

      console.log('📹 Replacing video track for all peers', newTrack);

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
      console.log('🎉 Finished updating video tracks for all peers');
    }

    function displayEmoji(emoji: string, author: string) {
      // Push the emoji to the call emojis array so it can be displayed in the UI
      const emojiId = crypto.randomUUID();
      callEmojis.value.push({ id: emojiId, author, emoji });

      // Play the emoji sound
      if (emoji === '💋' || emoji === '😘') kissSound.play();
      else if (emoji === '🎸') guitarSound.play();
      else if (emoji === '🐷' || emoji === '🐖') pigSound.play();
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

      if (predicate === WEBRTC_SIGNAL) {
        let senderKey: string | null = null;
        try {
          // WEBRTC_SIGNAL is session-precise: the payload carries the sender's
          // session id and the target is a list of recipient session ids.
          const parsed = JSON.parse(source);
          const fromSessionId = parsed?.fromSessionId;
          const signalData = parsed?.signal;

          // Ignore our own session (but DO process our other sessions, so the
          // same agent can connect across tabs/devices).
          if (!fromSessionId || fromSessionId === mySessionId) return;

          const recipients = JSON.parse(target) as string[];
          if (!signalData || typeof signalData !== 'object' || !recipients.includes(mySessionId)) return;

          senderKey = sessionKey(author, fromSessionId);

          // Find or create the peer connection for this session
          let peer: SimplePeer.Instance;
          const existingConnection = peerConnections.value.get(senderKey);

          if (existingConnection) peer = existingConnection.peer;
          else peer = createPeerConnection(author, fromSessionId, false);

          // Handle the signal data
          peer.signal(signalData);
        } catch (e) {
          console.error(`❌ Error handling WebRTC signal from ${author}:`, e);
          if (senderKey) cleanupPeerConnection(senderKey);
        }
      }

      if (predicate === WEBRTC_STREAM_REQUEST && link.author !== me.value.did) {
        // Handle stream request from peer
        try {
          const recipients = JSON.parse(target) as string[];
          const peerConnection = peerConnections.value.get(author);
          if (!localStream.value || !peerConnection || !recipients.includes(me.value.did)) return;

          // Add local stream tracks to the peer connection
          localStream.value.getTracks().forEach((track) => peerConnection.peer.addTrack(track, localStream.value!));
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
      iceServers.value = getDefaultIceServers();
    }

    async function joinRoom() {
      joiningCall.value = true;

      try {
        // Calls are no longer pinned to a single tab — this session joins
        // independently, so the same agent can be in the call from several
        // tabs/devices at once.

        // Update the call route
        callRoute.value = route.params;

        // Add the webrtc signal handler to the signalling service
        signallingService.value?.addSignalHandler(webrtcSignalHandler);

        // Establish connections with every other session already in the call
        // (including our own other sessions, so their media shows too).
        callSessions.value.forEach((session) => {
          if (session.sessionKey === mySessionKey.value) return;

          // Only one side of each pair initiates — decided by comparing session
          // keys so two sessions of the same agent don't both wait on each other.
          createPeerConnection(session.did, session.sessionId, shouldInitiate(mySessionKey.value, session.sessionKey));
        });

        // Set the video layout to focused on mobile for better experience
        if (uiStore.isLandscapeMobile) {
          uiStore.setVideoLayout({ label: 'Focused', class: 'focused', icon: 'person-video2' });
        }

        inCall.value = true;
      } catch (error) {
        console.error('Error joining call:', error);
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
        peerConnections.value.forEach((_, key) => cleanupPeerConnection(key));

        // Remove the webrtc signal handler from the signalling service
        signallingService.value?.removeSignalHandler(webrtcSignalHandler);

        // Release media devices
        mediaDevicesStore.resetMediaDevices();

        // Reset state
        inCall.value = false;
        callRoute.value = {};

        // Exit fullscreen before closing the call window
        if (uiStore.callWindowFullscreen) {
          uiStore.toggleCallWindowFullscreen();
        }

        // Close the call window
        uiStore.setCallWindowOpen(false);
      } catch (error) {
        console.error('Error leaving call:', error);
      }
    }

    async function copyCallLink() {
      try {
        await navigator.clipboard.writeText(location.href);
        appStore.showSuccessToast({ message: 'Call invite link copied to clipboard!' });

        // Clear any existing timer to avoid multiple pending timeouts
        if (copyLinkTimer !== null) {
          clearTimeout(copyLinkTimer);
        }

        hasCopiedLink.value = true;
        copyLinkTimer = setTimeout(() => {
          hasCopiedLink.value = false;
          copyLinkTimer = null;
        }, 3000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        appStore.showDangerToast({ message: 'Failed to copy link to clipboard' });
      }
    }

    // Close the call window on route param changes if not in a call or a channel
    watch(
      () => route.params,
      async (newParams) => {
        if (!inCall.value && !newParams.channelId) uiStore.setCallWindowOpen(false);
      },
    );

    // Rebuild the per-session call list whenever community presence or the call
    // route changes. Each in-call session (one per tab/device) is its own entry.
    watch(
      [agentsInCommunity, callRoute],
      async () => {
        const channelId = callRoute.value.channelId;
        const sessionEntries = Object.entries(agentsInCommunity.value).filter(
          ([, agent]) => agent.inCall && agent.callRoute.channelId === channelId,
        );
        // Merge the session states with their (DID-level) profiles
        callSessions.value = await Promise.all(
          sessionEntries.map(async ([key, agent]) => ({
            ...agent,
            ...(await getCachedAgentProfile(agent.did, appStore.ad4mClient)),
            sessionKey: key,
          })),
        );
      },
      { deep: true },
    );

    // Create peer connections for new sessions in the call
    watch(
      callSessions,
      (sessions) => {
        if (!inCall.value) return;

        const existingPeerKeys = Array.from(peerConnections.value.keys());

        // Handle new sessions
        sessions.forEach((session) => {
          // Skip our own session (but connect to our other sessions)
          if (session.sessionKey === mySessionKey.value) return;

          // Skip if we already have a connection with this session
          if (peerConnections.value.has(session.sessionKey)) return;

          // Skip if the session has just disconnected in the last HEARTBEAT_INTERVAL
          if (disconnectedAgents.value.includes(session.sessionKey)) return;

          // Create a new peer connection
          createPeerConnection(session.did, session.sessionId, shouldInitiate(mySessionKey.value, session.sessionKey));
        });

        // Remove sessions that left the call or are no longer active
        existingPeerKeys.forEach((key) => {
          if (!sessions.some((s) => s.sessionKey === key)) cleanupPeerConnection(key);
        });
      },
      { deep: true },
    );

    // Signal media changes directly to peers via webrtc data channel to avoid delay with holochain signalling
    watch(
      mediaSettings,
      (newSettings, oldSettings) => {
        if (!inCall.value || !newSettings || !oldSettings) return;

        if (newSettings.audioEnabled !== oldSettings.audioEnabled) {
          signalPeers(WEBRTC_MEDIA_SETTINGS_CHANGED, { type: 'audio', enabled: newSettings.audioEnabled });
        }

        if (newSettings.videoEnabled !== oldSettings.videoEnabled) {
          signalPeers(WEBRTC_MEDIA_SETTINGS_CHANGED, { type: 'video', enabled: newSettings.videoEnabled });
        }

        if (newSettings.screenShareEnabled !== oldSettings.screenShareEnabled) {
          signalPeers(WEBRTC_MEDIA_SETTINGS_CHANGED, { type: 'screenShare', enabled: newSettings.screenShareEnabled });
        }
      },
      { deep: true },
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
      { immediate: true },
    );

    return {
      inCall,
      callRoute,
      myAgentStatus,
      agentsInCall,
      callHealth,
      callEmojis,
      communityService,
      peerConnections,
      joiningCall,
      iceServers,
      disconnectedAgents,
      hasCopiedLink,
      addTrack,
      addScreenShareTrack,
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
      copyCallLink,
    };
  },
  { persist: false },
);
