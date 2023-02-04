import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import {
  Ad4mClient,
  PerspectiveProxy,
  Agent,
  Literal,
} from "@perspect3vism/ad4m";

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun.services.mozilla.com",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

const ICE_CANDIDATE = "ice-candidate";
const MAKE_OFFER_TO_AGENT = "make-offer-please";
const OFFER = "offer";
const ANSWER = "answer";

type Props = {
  uuid: string;
  source: string;
};

export enum Event {
  PEER_ADDED = "peer-added",
  PEER_REMOVED = "peer-removed",
}

export default class WebRTCManager {
  private agentAskedToJoin: boolean;
  private agent: Agent;
  private client: Ad4mClient;
  private perspective: PerspectiveProxy;
  private roomId: string;
  private callbacks: Record<Event, any[]> = {
    [Event.PEER_ADDED]: [],
    [Event.PEER_REMOVED]: [],
  };

  localStream: MediaStream;
  connections = new Map<string, RTCPeerConnection>();

  constructor(props: Props) {
    this.init(props);
  }

  async init(props: Props) {
    console.log("init constructor");
    this.roomId = props.source;
    this.client = await getAd4mClient();
    this.agent = await this.client.agent.me();
    this.perspective = await this.client.perspective.byUUID(props.uuid);
    this.perspective.addListener("link-added", (link) => this.onLink(link));
    this.emitPeerEvents();
  }

  emitPeerEvents() {
    const that = this;

    this.connections.set = function (key: string, value: RTCPeerConnection) {
      console.log(`Added key: ${key} value: ${value} to the map`);

      that.callbacks[Event.PEER_ADDED].forEach((cb) => {
        cb(key, value);
      });

      return Reflect.apply(Map.prototype.set, this, arguments);
    };

    // Listen for deletions from the map
    this.connections.delete = function (key: string) {
      console.log(`Deleted key: ${key} from the map`);

      that.callbacks[Event.PEER_REMOVED].forEach((cb) => {
        cb(key);
      });

      return Reflect.apply(Map.prototype.delete, this, arguments);
    };
  }

  on(event: Event, cb: any) {
    this.callbacks[event].push(cb);
  }

  async onLink(link): Promise<void> {
    console.log({ link, agentAskedToJoin: this.agentAskedToJoin });

    if (!this.agentAskedToJoin) return;
    if (link.author === this.agent.did) return;

    if (
      link.data.predicate === MAKE_OFFER_TO_AGENT &&
      link.data.source === this.roomId
    ) {
      this.createOffer(link.data.target);
    }
    // Only handle the offer if it's for me
    if (link.data.predicate === OFFER && link.data.source === this.agent.did) {
      const offer = Literal.fromUrl(link.data.target).get();
      this.handleOffer(link.author, offer);
    }
    // Only handle the answer if it's for me
    if (link.data.predicate === ANSWER && link.data.source === this.agent.did) {
      const answer = Literal.fromUrl(link.data.target).get();
      this.handleAnswer(link.autor, answer);
    }
    // Only handle the answer if it's for me
    if (
      link.data.predicate === ICE_CANDIDATE &&
      link.data.source === this.agent.did
    ) {
      const candidate = Literal.fromUrl(link.data.target).get();
      this.handleIceCandidate(link.autor, candidate);
    }
  }

  async handleIceCandidate(fromDid: string, candidate: RTCIceCandidate) {
    const connection = this.connections.get(fromDid);
    if (connection) {
      connection.addIceCandidate(candidate);
    }
  }

  async addConnection(did: string) {
    if (this.connections.get(did)) {
      return this.connections.get(did);
    }

    const newConnection = new RTCPeerConnection(servers);
    this.connections.set(did, newConnection);

    newConnection.addEventListener("negotiationneeded", async (event) => {
      const offer = await newConnection.createOffer();
      await newConnection.setLocalDescription(offer);

      this.perspective.add({
        source: did,
        predicate: OFFER,
        target: Literal.from(offer).toUrl(),
      });
    });

    newConnection.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        this.perspective.add({
          source: did,
          predicate: ICE_CANDIDATE,
          target: Literal.from(event.candidate.toJSON()).toUrl(),
        });
      }
    });

    newConnection.addEventListener("iceconnectionstatechange", (ev) => {
      if (newConnection.iceConnectionState === "disconnected") {
        // TODO: Remove peer from participants;
        newConnection.close();
        this.connections.delete(did);
      }
    });

    // Connect the stream to the connection
    this.localStream.getTracks().forEach((track) => {
      newConnection.addTrack(track, this.localStream);
    });

    return newConnection;
  }

  async createOffer(recieverDid: string) {
    this.addConnection(recieverDid);
  }

  async handleAnswer(fromDid: string, answer: RTCSessionDescriptionInit) {
    const connection = await this.addConnection(fromDid);
    const answerDescription = new RTCSessionDescription(answer);
    connection.setRemoteDescription(answerDescription);
  }

  async handleOffer(fromDid: string, offer: RTCSessionDescriptionInit) {
    const connection = await this.addConnection(fromDid);

    connection.setRemoteDescription(
      new RTCSessionDescription({
        type: "offer",
        sdp: offer.sdp,
      })
    );

    const answer = await connection.createAnswer();
    connection.setLocalDescription(answer);

    this.perspective.add({
      source: fromDid,
      predicate: ANSWER,
      target: Literal.from(answer).toUrl(),
    });
  }

  async join() {
    console.log("Start joining");
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    await this.perspective.add({
      source: this.roomId,
      predicate: MAKE_OFFER_TO_AGENT,
      target: this.agent.did,
    });

    this.agentAskedToJoin = true;
  }

  async leave() {
    this.connections.forEach((c) => {
      c.close();
    });
  }
}
