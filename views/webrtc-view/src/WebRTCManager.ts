import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import {
  Ad4mClient,
  PerspectiveProxy,
  Agent,
  Literal,
  LinkExpression,
} from "@perspect3vism/ad4m";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun.services.mozilla.com"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const ICE_CANDIDATE = "ice-candidate";
const OFFER_REQUEST = "offer-request";
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
  private agent: Agent;
  private client: Ad4mClient;
  private perspective: PerspectiveProxy;
  private roomId: string;
  private callbacks: Record<Event, Array<(...args: any[]) => void>> = {
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
    this.localStream = new MediaStream();
    this.roomId = props.source;
    this.client = await getAd4mClient();
    this.agent = await this.client.agent.me();
    this.perspective = await this.client.perspective.byUUID(props.uuid);
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

  async onLink(link: LinkExpression): Promise<void> {
    if (link.author === this.agent.did) return;

    console.log({ link });

    if (
      link.data.predicate === OFFER_REQUEST &&
      link.data.source === this.roomId
    ) {
      this.createOffer(link.author);
    }
    // Only handle the offer if it's for me
    if (link.data.predicate === OFFER && link.data.source === this.agent.did) {
      const offer = Literal.fromUrl(link.data.target).get();
      this.handleOffer(link.author, offer);
    }
    // Only handle the answer if it's for me
    if (link.data.predicate === ANSWER && link.data.source === this.agent.did) {
      const answer = Literal.fromUrl(link.data.target).get();
      this.handleAnswer(link.author, answer);
    }
    // Only handle the answer if it's for me
    if (
      link.data.predicate === ICE_CANDIDATE &&
      link.data.source === this.agent.did
    ) {
      const candidate = Literal.fromUrl(link.data.target).get();
      this.handleIceCandidate(link.author, candidate);
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

    console.log("🔵 Adding listener to: ", newConnection);
    newConnection.addEventListener("icecandidate", (event) => {
      console.log("🔵 icecandidate triggered!");
      if (event.candidate) {
        this.perspective.add({
          source: did,
          predicate: ICE_CANDIDATE,
          target: Literal.from(event.candidate.toJSON()).toUrl(),
        });
      }
    });

    return newConnection;
  }

  async createOffer(recieverDid: string) {
    // Don't create an offer if we alread have a connection
    if (this.connections.get(recieverDid)) return;

    const connection = await this.addConnection(recieverDid);

    this.localStream.getTracks().forEach((track) => {
      console.log("adding track", track);
      connection.addTrack(track, this.localStream);
    });

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    await this.perspective.add({
      source: recieverDid,
      predicate: OFFER,
      target: Literal.from(offer).toUrl(),
    });
  }

  async handleOffer(fromDid: string, offer: RTCSessionDescriptionInit) {
    // Don't create an answer if we alread have a connection
    if (this.connections.get(fromDid)) return;

    const connection = await this.addConnection(fromDid);
    await connection.setRemoteDescription(new RTCSessionDescription(offer));

    this.localStream.getTracks().forEach((track) => {
      console.log("adding track", track);
      connection.addTrack(track, this.localStream);
    });

    // Create Answer to offer
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    await this.perspective.add({
      source: fromDid,
      predicate: ANSWER,
      target: Literal.from(answer).toUrl(),
    });
  }

  async handleAnswer(fromDid: string, answer: RTCSessionDescriptionInit) {
    const connection = this.connections.get(fromDid);
    if (connection && !connection.currentRemoteDescription) {
      const answerDescription = new RTCSessionDescription(answer);
      await connection.setRemoteDescription(answerDescription);
    } else {
      console.warn("Couldn't handle answer from ", fromDid);
    }
  }

  async join() {
    console.log("Start joining");

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    await this.perspective.add({
      source: this.roomId,
      predicate: OFFER_REQUEST,
      target: this.agent.did,
    });

    this.perspective.addListener("link-added", (link) => this.onLink(link));

    return this.localStream;
  }

  async leave() {
    this.connections.forEach((c) => {
      c.close();
    });
  }
}
