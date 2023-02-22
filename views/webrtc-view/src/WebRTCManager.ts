import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import {
  Ad4mClient,
  PerspectiveProxy,
  Agent,
  Literal,
  LinkExpression,
  NeighbourhoodProxy,
  Link,
  PerspectiveExpression,
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

async function createSignalLink(client: Ad4mClient, link: Link) {
  const perspective = await client.perspective.add("temp");
  perspective.add(link);
  const snapshot = perspective.snapshot();

  await client.perspective.remove(perspective.uuid);
  return snapshot;
}

async function getLinkFromPerspective(expression: PerspectiveExpression) {
  try {
    return expression.data.links[0];
  } catch (e) {
    return null;
  }
}

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
  private neighbourhood: NeighbourhoodProxy;
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
    this.neighbourhood = new NeighbourhoodProxy(
      this.client.neighbourhood,
      this.perspective.uuid
    );
    this.onSignal = this.onSignal.bind(this);
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

  async onSignal(expression: PerspectiveExpression) {
    if (expression.author === this.agent.did) return null;

    const link = await getLinkFromPerspective(expression);

    console.log(`🔵 ${link?.data?.predicate}`, { link });

    if (!link) return;

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

  async closeConnection(did: string) {
    const connection = this.connections.get(did);

    if (connection) {
      connection.peerConnection.close();
      connection.dataChannel.close();
      this.connections.delete(did);
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
            return this.closeConnection(parsedData.message);
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

    peerConnection.addEventListener("icecandidate", async (event) => {
      if (event.candidate) {
        const signalLink = await createSignalLink(this.client, {
          source: remoteDid,
          predicate: ICE_CANDIDATE,
          target: Literal.from(event.candidate.toJSON()).toUrl(),
        });

        console.log("🟠 Sending ICE_CANDIDATE signal to ", remoteDid);
        this.neighbourhood.sendSignal(remoteDid, signalLink);
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
    if (this.connections.get(recieverDid)) {
      this.closeConnection(recieverDid);
    }

    const connection = await this.addConnection(recieverDid);

    this.localStream.getTracks().forEach((track) => {
      connection.peerConnection.addTrack(track, this.localStream);
    });

    const offer = await connection.peerConnection.createOffer();
    await connection.peerConnection.setLocalDescription(offer);

    const signalLink = await createSignalLink(this.client, {
      source: recieverDid,
      predicate: OFFER,
      target: Literal.from(offer).toUrl(),
    });

    console.log("🟠 Sending OFFER signal to ", recieverDid);
    this.neighbourhood.sendSignal(recieverDid, signalLink);
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

    const signalLink = await createSignalLink(this.client, {
      source: fromDid,
      predicate: ANSWER,
      target: Literal.from(answer).toUrl(),
    });

    console.log("🟠 Sending ANSWER signal to ", fromDid);
    this.neighbourhood.sendSignal(fromDid, signalLink);
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
        if (e.dataChannel.readyState === "open") {
          console.log(
            `🟠 Sending DATACHANNEL message to ${key} -> `,
            type,
            message
          );
          e.dataChannel.send(data);
        } else {
          console.log(
            `Couldn't send message to ${key} as connection is not open -> `,
            type,
            message
          );
        }
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

    const signalLink = await createSignalLink(this.client, {
      source: this.roomId,
      predicate: OFFER_REQUEST,
      target: this.agent.did,
    });

    console.log("🟠 Sending JOIN broadcast");
    this.neighbourhood.sendBroadcast(signalLink);
    this.neighbourhood.addSignalHandler(this.onSignal);

    return this.localStream;
  }

  async leave() {
    if (this.perspective) {
      // Todo: Nico, nico, nico!
      // this.neighbourhood.removeSignalHandler
    }

    if (this.agent) {
      await this.sendMessage("leave", this.agent.did);
    }

    this.connections.forEach((c, key) => {
      this.closeConnection(key);
    });
  }
}
