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

function getData(data: any) {
  let parsedData;
  try {
    parsedData = JSON.parse(data);
  } catch (e) {
    parsedData = data;
  } finally {
    return parsedData;
  }
}

export const ICE_CANDIDATE = "ice-candidate";
export const OFFER_REQUEST = "offer-request";
export const OFFER = "offer";
export const ANSWER = "answer";

export type Connection = {
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
};

export type Settings = {
  video: boolean;
  audio: boolean;
  screen: boolean;
};

export type Props = {
  uuid: string;
  source: string;
};

export enum Event {
  PEER_ADDED = "peer-added",
  PEER_REMOVED = "peer-removed",
  CONNECTION_STATE = "connectionstate",
  CONNECTION_STATE_DATA = "connectionstateData",
  MESSAGE = "message",
}

export default class WebRTCManager {
  private agent: Agent;
  private client: Ad4mClient;
  private perspective: PerspectiveProxy;
  private roomId: string;
  private callbacks: Record<Event, Array<(...args: any[]) => void>> = {
    [Event.PEER_ADDED]: [],
    [Event.PEER_REMOVED]: [],
    [Event.MESSAGE]: [],
    [Event.CONNECTION_STATE]: [],
    [Event.CONNECTION_STATE_DATA]: [],
  };

  localStream: MediaStream;
  connections = new Map<string, Connection>();

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
    this.onLink = this.onLink.bind(this);
    this.emitPeerEvents();

    // Close connections if we refresh
    window.addEventListener("beforeunload", () => {
      this.leave();
    });
  }

  emitPeerEvents() {
    const that = this;

    this.connections.set = function (key: string, value: Connection) {
      console.log(`✅ Added key: ${key} value: ${value} to the map`);

      that.callbacks[Event.PEER_ADDED].forEach((cb) => {
        cb(key, value);
      });

      return Reflect.apply(Map.prototype.set, this, arguments);
    };

    // Listen for deletions from the map
    this.connections.delete = function (key: string) {
      console.log(`🚫 Deleted key: ${key} from the map`);

      that.callbacks[Event.PEER_REMOVED].forEach((cb) => {
        cb(key);
      });

      return Reflect.apply(Map.prototype.delete, this, arguments);
    };
  }

  on(event: Event, cb: any) {
    this.callbacks[event].push(cb);
  }

  onLink(link: LinkExpression) {
    if (link.author === this.agent.did) return null;

    console.log(`🔵 ${link?.data?.predicate}`, { link });

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

    return null;
  }

  async handleIceCandidate(fromDid: string, candidate: RTCIceCandidate) {
    const connection = this.connections.get(fromDid);
    // Make sure we have a remote description;
    if (connection && connection.peerConnection.currentRemoteDescription) {
      connection.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  async addConnection(remoteDid: string) {
    if (this.connections.get(remoteDid)) {
      return this.connections.get(remoteDid);
    }

    const peerConnection = new RTCPeerConnection(servers);
    let dataChannel = peerConnection.createDataChannel("DataChannel");

    peerConnection.ondatachannel = ({ channel }) => {
      console.log("Datachannel established");
      dataChannel = channel;

      this.callbacks[Event.CONNECTION_STATE_DATA].forEach((cb) => {
        cb(remoteDid, "connected");
      });

      dataChannel.addEventListener("message", (event) => {
        if (event.data) {
          console.log("📩 Received message -> ", event.data);
          const parsedData = getData(event.data);

          if (parsedData.type === "leave") {
            return this.connections.delete(parsedData.message);
          }

          this.callbacks[Event.MESSAGE].forEach((cb) => {
            cb(remoteDid, parsedData.type || "unknown", parsedData.message);
          });
        }
      });
    };

    const newConnection = {
      peerConnection,
      dataChannel,
    };

    this.connections.set(remoteDid, newConnection);

    peerConnection.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        this.perspective.add({
          source: remoteDid,
          predicate: ICE_CANDIDATE,
          target: Literal.from(event.candidate.toJSON()).toUrl(),
        });
      }
    });

    peerConnection.addEventListener("iceconnectionstatechange", (event) => {
      const c = event.target as RTCPeerConnection;
      console.log("🔄 connection state is", c.iceConnectionState);
      if (c.iceConnectionState === "disconnected") {
        this.connections.delete(remoteDid);
      }

      this.callbacks[Event.CONNECTION_STATE].forEach((cb) => {
        cb(remoteDid, c.iceConnectionState);
      });
    });

    return newConnection;
  }

  async createOffer(recieverDid: string) {
    // Don't create an offer if we alread have a connection
    if (this.connections.get(recieverDid)) return;

    const connection = await this.addConnection(recieverDid);

    this.localStream.getTracks().forEach((track) => {
      connection.peerConnection.addTrack(track, this.localStream);
    });

    const offer = await connection.peerConnection.createOffer();
    await connection.peerConnection.setLocalDescription(offer);

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
    await connection.peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    this.localStream.getTracks().forEach((track) => {
      connection.peerConnection.addTrack(track, this.localStream);
    });

    // Create Answer to offer
    const answer = await connection.peerConnection.createAnswer();
    await connection.peerConnection.setLocalDescription(answer);

    await this.perspective.add({
      source: fromDid,
      predicate: ANSWER,
      target: Literal.from(answer).toUrl(),
    });
  }

  async handleAnswer(fromDid: string, answer: RTCSessionDescriptionInit) {
    const connection = this.connections.get(fromDid);
    if (connection && !connection.peerConnection.currentRemoteDescription) {
      const answerDescription = new RTCSessionDescription(answer);
      await connection.peerConnection.setRemoteDescription(answerDescription);
    } else {
      console.warn("Couldn't handle answer from ", fromDid);
    }
  }

  async sendMessage(type: string, message: any, recepients?: string[]) {
    const data = JSON.stringify({
      type,
      message,
    });
    this.connections.forEach((e, key) => {
      if (!recepients || recepients.includes(key)) {
        console.log(`✉️ Sending message to ${key} -> `, type, message);
        e.dataChannel.send(data);
      }
    });

    // Notify self of message
    this.callbacks[Event.MESSAGE].forEach((cb) => {
      cb(this.agent.did, type || "unknown", message);
    });
  }

  async join(initialSettings?: Settings) {
    console.log("Start joining");

    let settings = { audio: true, video: false, ...initialSettings };

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: settings.audio,
      video: settings.video,
    });

    await this.perspective.add({
      source: this.roomId,
      predicate: OFFER_REQUEST,
      target: this.agent.did,
    });

    this.perspective.addListener("link-added", this.onLink);

    return this.localStream;
  }

  async leave() {
    if (this.perspective) {
      this.perspective.removeListener("link-added", this.onLink);
    }

    if (this.agent) {
      await this.sendMessage("leave", this.agent.did);
    }

    this.connections.forEach((c, key) => {
      // Closing connection will not trigger iceconnectionstatechange
      c.peerConnection.close();
      c.dataChannel.close();
      this.connections.delete(key);
    });
  }
}
