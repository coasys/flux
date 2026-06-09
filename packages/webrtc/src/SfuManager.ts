/**
 * SFU (Selective Forwarding Unit) manager for WebRTC calls.
 *
 * When the SFU is available for a neighbourhood, each peer connects once to the SFU
 * instead of maintaining N-1 direct connections. The SFU forwards streams selectively.
 *
 * Falls back to mesh (WebRTCManager) when:
 * - SFU mode is "mesh" (default)
 * - SFU peer is unavailable
 * - Participant count is ≤ maxMeshParticipants
 */

import { NeighbourhoodProxy } from "@coasys/ad4m";
// Forward-port note: types live on the top-level @coasys/ad4m export now
// (was deep-imported from NeighbourhoodClient pre WS-RPC migration).
import type {
  SfuConfig,
  CallSessionInfo as CallSession,
} from "@coasys/ad4m";

export type SfuTopology = "sfu" | "mesh" | "cascaded";

export interface SfuNodeState {
  did: string;
  participantCount: number;
  capacityHint: number;
}
export type QualityPreference = "auto" | "high" | "medium" | "low";

/** ICE server configuration for SFU peer connections. */
export interface SfuIceConfig {
  stun?: string[];
  turn?: { urls: string; username: string; credential: string }[];
}

/** Default ICE servers — can be overridden via SfuManager constructor. */
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

/** Timeout for ICE gathering (ms). */
const ICE_GATHERING_TIMEOUT_MS = 8000;

export interface SfuCallState {
  topology: SfuTopology;
  roomId: string;
  participantId: string | null;
  sfuPeerDid: string | null;
  participants: Map<string, SfuParticipantState>;
  localStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  cascadeNodes: SfuNodeState[];
  connectedNodeDid: string | null;
  /** DIDs of participants already in the room at join time */
  knownParticipantDids: string[];
}

export interface SfuParticipantState {
  did: string;
  stream: MediaStream;
  hasAudio: boolean;
  hasVideo: boolean;
  isActiveSpeaker: boolean;
}

export type SfuEvent =
  | "topology-changed"
  | "participant-joined"
  | "participant-left"
  | "active-speaker"
  | "stream-added"
  | "stream-removed"
  | "error";

export type SfuEventCallback = (...args: any[]) => void;

/**
 * Determines the optimal call topology based on SFU config and availability.
 */
export async function resolveTopology(
  neighbourhood: NeighbourhoodProxy,
  neighbourhoodUrl: string,
  participantCount: number
): Promise<{ topology: SfuTopology; sfuPeer: string | null; config: SfuConfig }> {
  const config = await neighbourhood.sfuConfig(neighbourhoodUrl);

  if (config.mode === "cascaded") {
    // In cascaded mode, query for available SFU nodes
    const sfuPeers: string[] = await neighbourhood.sfuPeers(neighbourhoodUrl);
    if (sfuPeers.length > 1) {
      return { topology: "cascaded" as SfuTopology, sfuPeer: sfuPeers[0], config };
    }
    if (sfuPeers.length === 1) {
      return { topology: "sfu", sfuPeer: sfuPeers[0], config };
    }
    return { topology: "mesh", sfuPeer: null, config };
  }

  if (config.mode === "mesh") {
    return { topology: "mesh", sfuPeer: null, config };
  }

  const sfuPeer = await neighbourhood.sfuPeer(neighbourhoodUrl);

  if (!sfuPeer) {
    if (participantCount <= config.maxMeshParticipants) {
      return { topology: "mesh", sfuPeer: null, config };
    }
    console.warn(
      `SFU peer unavailable and ${participantCount} participants exceeds mesh limit (${config.maxMeshParticipants}). Attempting mesh anyway.`
    );
    return { topology: "mesh", sfuPeer: null, config };
  }

  if (participantCount <= config.maxMeshParticipants) {
    return { topology: "mesh", sfuPeer, config };
  }

  return { topology: "sfu", sfuPeer, config };
}

/**
 * SFU call manager. Handles WebRTC connection to the SFU server via the executor's GraphQL API.
 */
export class SfuManager {
  private neighbourhood: any; // NeighbourhoodClient or NeighbourhoodProxy
  private neighbourhoodUrl: string; // URL for NeighbourhoodClient calls
  private roomId: string;
  private agentDid: string;
  private state: SfuCallState;
  private callbacks: Map<SfuEvent, SfuEventCallback[]> = new Map();
  private iceServers: RTCIceServer[];
  private streamToParticipant: Map<string, string> = new Map();
  /** Index into knownParticipantDids for correlating tracks to DIDs */
  private trackDidIndex: number = 0;

  constructor(neighbourhood: any, roomId: string, agentDid: string, neighbourhoodUrl?: string, iceConfig?: SfuIceConfig) {
    this.neighbourhood = neighbourhood;
    this.neighbourhoodUrl = neighbourhoodUrl || '';
    this.roomId = roomId;
    this.agentDid = agentDid;
    this.state = {
      topology: "sfu",
      roomId,
      participantId: null,
      sfuPeerDid: null,
      participants: new Map(),
      localStream: null,
      peerConnection: null,
      cascadeNodes: [],
      connectedNodeDid: null,
      knownParticipantDids: [],
    };

    // Build ICE servers from config or use defaults
    const servers: RTCIceServer[] = [];
    if (iceConfig?.stun) {
      for (const url of iceConfig.stun) {
        servers.push({ urls: url });
      }
    }
    if (iceConfig?.turn) {
      for (const t of iceConfig.turn) {
        servers.push({ urls: t.urls, username: t.username, credential: t.credential });
      }
    }
    this.iceServers = servers.length > 0 ? servers : DEFAULT_ICE_SERVERS;
  }

  /** Select the least-loaded SFU node from the cascade. */
  private selectNode(nodes: SfuNodeState[]): SfuNodeState | null {
    if (nodes.length === 0) return null;
    return nodes.reduce((best, n) =>
      n.participantCount < best.participantCount ? n : best
    );
  }

  /** Handle SFU node disconnection in cascaded mode — reconnect to another node. */
  private async handleCascadeFailover(): Promise<void> {
    if (this.state.topology !== "cascaded") return;

    const availableNodes = this.state.cascadeNodes.filter(
      n => n.did !== this.state.connectedNodeDid
    );
    const nextNode = this.selectNode(availableNodes);
    if (!nextNode) {
      console.warn("No cascade nodes available for failover, falling back to mesh");
      this.emit("topology-changed", "mesh");
      return;
    }

    console.info(`SFU cascade failover: reconnecting to node ${nextNode.did}`);
    this.state.connectedNodeDid = nextNode.did;
    this.state.sfuPeerDid = nextNode.did;

    // Reconnect
    if (this.state.localStream) {
      try {
        if (this.state.peerConnection) {
          this.state.peerConnection.close();
          this.state.peerConnection = null;
        }
        await this.join(this.state.localStream);
      } catch (e) {
        console.error("Cascade failover failed:", e);
        this.emit("error", e);
      }
    }
  }

  on(event: SfuEvent, callback: SfuEventCallback): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: SfuEvent, callback?: SfuEventCallback): void {
    if (!callback) {
      this.callbacks.delete(event);
      return;
    }
    const cbs = this.callbacks.get(event);
    if (cbs) {
      const idx = cbs.indexOf(callback);
      if (idx !== -1) cbs.splice(idx, 1);
      if (cbs.length === 0) this.callbacks.delete(event);
    }
  }

  private emit(event: SfuEvent, ...args: any[]): void {
    const cbs = this.callbacks.get(event);
    if (cbs) {
      for (const cb of cbs) {
        try { cb(...args); } catch (e) { console.error(`SFU event handler error (${event}):`, e); }
      }
    }
  }

  /**
   * Join the SFU call with simulcast support.
   */
  async join(localStream: MediaStream): Promise<void> {
    this.state.localStream = localStream;

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.state.peerConnection = pc;

    // ICE connection state monitoring for cascade failover
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        this.handleCascadeFailover();
      }
    };

    // Add local tracks — video with simulcast encodings (3 layers)
    for (const track of localStream.getTracks()) {
      if (track.kind === "video") {
        pc.addTransceiver(track, {
          direction: "sendrecv",
          sendEncodings: [
            { rid: "high", maxBitrate: 1500000 },
            { rid: "medium", maxBitrate: 500000, scaleResolutionDownBy: 2 },
            { rid: "low", maxBitrate: 150000, scaleResolutionDownBy: 4 },
          ],
        });
      } else {
        pc.addTrack(track, localStream);
      }
    }

    // Handle incoming tracks from SFU
    pc.ontrack = (event: RTCTrackEvent) => {
      const stream = event.streams[0];
      if (!stream) return;

      const existing = Array.from(this.state.participants.values()).find(
        (p) => p.stream.id === stream.id
      );

      // Resolve participant DID: try stream mapping first, then known DIDs by order, then fallback
      let participantDid = this.streamToParticipant.get(stream.id);
      if (!participantDid && this.state.knownParticipantDids.length > 0 && this.trackDidIndex < this.state.knownParticipantDids.length) {
        // Correlate by track arrival order matching the DID list
        participantDid = this.state.knownParticipantDids[this.trackDidIndex];
        this.streamToParticipant.set(stream.id, participantDid);
        this.trackDidIndex++;
      }
      if (!participantDid) participantDid = stream.id;

      if (existing) {
        existing.hasAudio = existing.hasAudio || event.track.kind === "audio";
        existing.hasVideo = existing.hasVideo || event.track.kind === "video";
      } else {
        const participant: SfuParticipantState = {
          did: participantDid,
          stream,
          hasAudio: event.track.kind === "audio",
          hasVideo: event.track.kind === "video",
          isActiveSpeaker: false,
        };
        this.state.participants.set(stream.id, participant);
        this.emit("participant-joined", participant);
      }

      this.emit("stream-added", stream, event.track);
      event.track.onended = () => this.emit("stream-removed", stream, event.track);
    };

    // Create and send offer to SFU
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for ICE gathering with timeout
    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === "complete") return resolve();
      const timeout = setTimeout(() => {
        pc.onicegatheringstatechange = null;
        console.warn("SFU: ICE gathering timed out, proceeding with partial candidates");
        resolve();
      }, ICE_GATHERING_TIMEOUT_MS);
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete") {
          clearTimeout(timeout);
          pc.onicegatheringstatechange = null;
          resolve();
        }
      };
    });

    const sdpOffer = JSON.stringify(pc.localDescription);
    const session: CallSession = await this.neighbourhood.callJoin(this.neighbourhoodUrl, this.roomId, sdpOffer);
    this.state.participantId = session.participantId;

    // Handle SFU redirect (cascaded mode: SFU tells us to connect elsewhere)
    if (session.redirectTo) {
      console.info(`SFU redirect: reconnecting to node ${session.redirectTo}`);
      this.state.connectedNodeDid = session.redirectTo;
      this.state.sfuPeerDid = session.redirectTo;
      pc.close();
      this.state.peerConnection = null;
      return await this.join(localStream);
    }

    // The SFU returns a list of participant DIDs already in the room.
    // Tracks arrive via ontrack; correlation uses CallStreamEvent subscriptions
    // or the order of received tracks matching the DID list.
    if (session.streamMapping && session.streamMapping.length > 0) {
      // Store known participant DIDs for correlation in ontrack handler
      this.state.knownParticipantDids = session.streamMapping;
      // Track index counter for DID correlation
      this.trackDidIndex = 0;
    }

    const answer = JSON.parse(session.sdpAnswer);
    await pc.setRemoteDescription(new RTCSessionDescription(answer));

    // Subscribe to server-initiated renegotiation offers (for new peers joining)
    this.neighbourhood.subscribeCallRenegotiationOffer(this.agentDid, async (event: { reason: string; sdpOffer: string; roomId: string }) => {
      console.info(`SFU: received renegotiation offer (reason: ${event.reason})`);
      const currentPc = this.state.peerConnection;
      if (!currentPc) {
        console.warn("SFU: no peer connection for renegotiation");
        return;
      }
      try {
        const offerSdp = JSON.parse(event.sdpOffer);
        await currentPc.setRemoteDescription(new RTCSessionDescription(offerSdp));
        const renegAnswer = await currentPc.createAnswer();
        await currentPc.setLocalDescription(renegAnswer);
        const answerJson = JSON.stringify(currentPc.localDescription);
        await this.neighbourhood.callAnswerServerOffer(this.neighbourhoodUrl, event.roomId, answerJson);
        console.info("SFU: renegotiation answer sent successfully");
      } catch (err) {
        console.error("SFU: renegotiation failed:", err);
        this.emit("error", err);
      }
    });
  }

  async leave(): Promise<void> {
    if (this.state.peerConnection) {
      this.state.peerConnection.close();
      this.state.peerConnection = null;
    }
    try { await this.neighbourhood.callLeave(this.neighbourhoodUrl, this.roomId); } catch (e) { console.error("Error leaving SFU call:", e); }
    for (const [_, participant] of this.state.participants) {
      this.emit("participant-left", participant);
    }
    this.state.participants.clear();
    this.state.participantId = null;
  }

  async setQualityPreference(preference: QualityPreference): Promise<void> {
    if (!this.state.participantId) {
      console.warn("Cannot set quality preference: not connected to SFU");
      return;
    }
    try {
      await this.neighbourhood.callSetQualityPreference(this.neighbourhoodUrl, this.roomId, preference);
    } catch (e) {
      console.error("Failed to set quality preference:", e);
      this.emit("error", e);
    }
  }

  getState(): Readonly<SfuCallState> { return this.state; }
  getParticipants(): SfuParticipantState[] { return Array.from(this.state.participants.values()); }

  async destroy(): Promise<void> {
    // Notify SFU server before closing the connection
    try { await this.leave(); } catch (e) { console.error("Error during SFU destroy:", e); }
    this.callbacks.clear();
    this.streamToParticipant.clear();
  }
}
