import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

import {
  Ad4mClient,
  PerspectiveProxy,
  Agent,
  Literal,
  NeighbourhoodProxy,
  Link,
  PerspectiveExpression,
} from "@perspect3vism/ad4m";

const rtcConfig = {
  iceServers: [
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
  ],
  iceCandidatePoolSize: 10,
};

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
export const LEAVE = "leave";
export const HEARTBEAT = "heartbeat";
export const TEST_SIGNAL = "test-signal";
export const TEST_BROADCAST = "test-broadcast";

export type EventLogItem = {
  timeStamp: string;
  type: string;
  value?: string;
};

export type Connection = {
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  mediaStream: MediaStream;
  eventLog: EventLogItem[];
};

export type Settings = {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
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
  EVENT = "event",
}

export default class WebRTCManager {
  private addedListener: boolean = false;
  private isListening: boolean = false;
  private agent: Agent;
  private client: Ad4mClient;
  private perspective: PerspectiveProxy;
  private neighbourhood: NeighbourhoodProxy;
  private roomId: string;
  private heartbeatId: NodeJS.Timeout;
  private callbacks: Record<Event, Array<(...args: any[]) => void>> = {
    [Event.PEER_ADDED]: [],
    [Event.PEER_REMOVED]: [],
    [Event.MESSAGE]: [],
    [Event.EVENT]: [],
    [Event.CONNECTION_STATE]: [],
    [Event.CONNECTION_STATE_DATA]: [],
  };

  localStream: MediaStream;
  localEventLog: EventLogItem[];
  connections = new Map<string, Connection>();

  constructor(props: Props) {
    this.init(props);
  }

  async init(props: Props) {
    console.log("init constructor");
    this.localStream = new MediaStream();
    this.localEventLog = [];
    this.roomId = props.source;
    this.client = await getAd4mClient();
    this.agent = await this.client.agent.me();
    this.perspective = await this.client.perspective.byUUID(props.uuid);
    this.neighbourhood = new NeighbourhoodProxy(
      this.client.neighbourhood,
      this.perspective.uuid
    );
    this.emitPeerEvents();

    // Bind methods
    this.on = this.on.bind(this);
    this.join = this.join.bind(this);
    this.onSignal = this.onSignal.bind(this);
    this.emitPeerEvents = this.emitPeerEvents.bind(this);
    this.handleIceCandidate = this.handleIceCandidate.bind(this);
    this.closeConnection = this.closeConnection.bind(this);
    this.addConnection = this.addConnection.bind(this);
    this.createOffer = this.createOffer.bind(this);
    this.handleOffer = this.handleOffer.bind(this);
    this.handleAnswer = this.handleAnswer.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.sendTestSignal = this.sendTestSignal.bind(this);
    this.broadcastOfferRequest = this.broadcastOfferRequest.bind(this);
    this.sendTestBroadcast = this.sendTestBroadcast.bind(this);
    this.addToEventLog = this.addToEventLog.bind(this);
    this.heartbeat = this.heartbeat.bind(this);
    this.leave = this.leave.bind(this);

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

  /**
   * Handle incoming signals
   */
  async onSignal(expression: PerspectiveExpression) {
    if (!this.isListening) return;

    if (expression.author === this.agent.did) {
      console.log("Received signal from self, ignoring!");
      return null;
    }

    const link = await getLinkFromPerspective(expression);
    console.log(`🔵 ${link?.data?.predicate}`, {
      link,
      author: expression.author,
    });

    if (!link) {
      this.addToEventLog(
        expression.author,
        link?.data?.predicate || "unknown",
        "Missing link!"
      );
      return;
    }

    if (link.data.predicate === LEAVE && link.data.source === this.roomId) {
      this.addToEventLog(link.author, link?.data?.predicate || "unknown");
      this.closeConnection(link.author);
    }

    if (
      link.data.predicate === OFFER_REQUEST &&
      link.data.source === this.roomId
    ) {
      // Check if we should create the offer or not
      if (link.author.localeCompare(this.agent.did) > 0) {
        await this.createOffer(link.author);
      } else {
        this.broadcastOfferRequest();
      }

      this.addToEventLog(link.author, link?.data?.predicate || "unknown");
    }

    // If we get heartbeat from new user, action!
    if (link.data.predicate === HEARTBEAT && link.data.source === this.roomId) {
      if (!this.connections.get(link.author)) {
        // Check if we should create the offer or not
        if (link.author.localeCompare(this.agent.did) > 0) {
          await this.createOffer(link.author);
        } else {
          this.broadcastOfferRequest();
        }
      }

      this.addToEventLog(link.author, link?.data?.predicate || "unknown");
    }
    // Only handle the offer if it's for me
    if (link.data.predicate === OFFER && link.data.source === this.agent.did) {
      const offer = Literal.fromUrl(link.data.target).get();
      await this.handleOffer(link.author, offer);
      this.addToEventLog(link.author, link?.data?.predicate || "unknown");
    }
    // Only handle the answer if it's for me
    if (link.data.predicate === ANSWER && link.data.source === this.agent.did) {
      const answer = Literal.fromUrl(link.data.target).get();
      await this.handleAnswer(link.author, answer);
      this.addToEventLog(link.author, link?.data?.predicate || "unknown");
    }
    // Only handle the answer if it's for me
    if (
      link.data.predicate === ICE_CANDIDATE &&
      link.data.source === this.agent.did
    ) {
      const candidate = Literal.fromUrl(link.data.target).get();
      await this.handleIceCandidate(link.author, candidate);
      this.addToEventLog(link.author, link?.data?.predicate || "unknown");
    }

    return null;
  }

  /**
   * Create Offer - Entry point for new connections
   *
   * 1: Create new connection, add to connections
   * 2: Add local audio/video tracks to peerconnection
   * 3: Create offer and set local description
   * 5: Broadcast offer to remote peer
   */
  async createOffer(recieverDid: string) {
    const currentConnection = this.connections.get(recieverDid);
    if (currentConnection) {
      const status = currentConnection.peerConnection.iceConnectionState;
      const inProgress = status === "new" || status === "checking";
      const isStale =
        status === "failed" || status === "disconnected" || status === "closed";

      if (inProgress) {
        return;
      }

      if (isStale) {
        this.closeConnection(recieverDid);
      }
    }

    const connection = await this.addConnection(recieverDid);

    this.localStream.getTracks().forEach((track) => {
      connection.peerConnection.addTrack(track, this.localStream);
    });

    const offer = await connection.peerConnection.createOffer();

    console.log("🟠 Sending OFFER signal to ", recieverDid);
    this.addToEventLog(this.agent.did, OFFER, recieverDid);

    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: recieverDid,
          predicate: OFFER,
          target: Literal.from(offer).toUrl(),
        },
      ],
    });

    await connection.peerConnection.setLocalDescription(offer);
  }

  /**
   * Create connection and add to connections array
   *
   * 1: Establish new RTC connection and datachannel
   * 2: Listen for ICE candidates on peer connection
   *    - Pass these to the remote peer via broadcast
   * 3: Listen for connection state change
   *    - If disconnected, delete connection
   */
  async addConnection(remoteDid: string) {
    if (this.connections.get(remoteDid)) {
      return this.connections.get(remoteDid);
    }

    const peerConnection = new RTCPeerConnection(rtcConfig);
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

          this.callbacks[Event.MESSAGE].forEach((cb) => {
            cb(remoteDid, parsedData.type || "unknown", parsedData.message);
          });
        }
      });
    };

    peerConnection.addEventListener("icecandidate", async (event) => {
      if (event.candidate) {
        console.log("🟠 Sending ICE_CANDIDATE signal to ", remoteDid);
        this.addToEventLog(this.agent.did, ICE_CANDIDATE, remoteDid);

        this.neighbourhood.sendBroadcastU({
          links: [
            {
              source: remoteDid,
              predicate: ICE_CANDIDATE,
              target: Literal.from(event.candidate.toJSON()).toUrl(),
            },
          ],
        });
      }
    });

    peerConnection.addEventListener("iceconnectionstatechange", (event) => {
      const c = event.target as RTCPeerConnection;
      console.log("🔄 connection state is", c.iceConnectionState);

      this.addToEventLog(remoteDid, "connection state", c.connectionState);

      if (c.iceConnectionState === "disconnected") {
        this.connections.delete(remoteDid);
      }

      if (c.iceConnectionState === "failed") {
        this.connections.delete(remoteDid);
      }

      if (c.iceConnectionState === "closed") {
        this.connections.delete(remoteDid);
      }

      this.callbacks[Event.CONNECTION_STATE].forEach((cb) => {
        cb(remoteDid, c.iceConnectionState);
      });
    });

    const mediaStream = new MediaStream();

    peerConnection.addEventListener("track", async (event) => {
      event.streams[0].getTracks().forEach((track) => {
        mediaStream.addTrack(track);
      });
    });

    const newConnection = {
      peerConnection,
      dataChannel,
      mediaStream,
      eventLog: [],
    };

    this.connections.set(remoteDid, newConnection);

    return newConnection;
  }

  /**
   * Process offer from peer, create answer
   *
   * 1: Add peer to local connections
   * 2: Add offer to remote description
   * 3: Add local audio/video tracks to peerconnection
   * 4: Create answer and add to local description
   * 5: Broadcast answer to remote peer
   */
  async handleOffer(fromDid: string, offer: RTCSessionDescriptionInit) {
    // Start over if we alread have a connection
    if (this.connections.get(fromDid)) {
      this.closeConnection(fromDid);
    }

    const connection = await this.addConnection(fromDid);
    await connection.peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    this.localStream.getTracks().forEach((track) => {
      connection.peerConnection.addTrack(track, this.localStream);
    });

    // Create Answer to offer
    const answer = await connection.peerConnection.createAnswer();

    console.log("🟠 Sending ANSWER signal to ", fromDid);
    this.addToEventLog(this.agent.did, ANSWER, fromDid);

    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: fromDid,
          predicate: ANSWER,
          target: Literal.from(answer).toUrl(),
        },
      ],
    });

    await connection.peerConnection.setLocalDescription(answer);
  }

  /**
   * Process answer from peer
   *
   * 1: Check that peerConnection has remote description
   * 2: Set remote description to answer
   */
  async handleAnswer(fromDid: string, answer: RTCSessionDescriptionInit) {
    const connection = this.connections.get(fromDid);
    if (connection && !connection.peerConnection.currentRemoteDescription) {
      const answerDescription = new RTCSessionDescription(answer);
      await connection.peerConnection.setRemoteDescription(answerDescription);
    } else {
      console.warn("Couldn't handle answer from ", fromDid);
    }
  }

  /**
   * Process ICE candidate from peer
   *
   * 1: Check that peerConnection does not have a remote description
   * 2: Add ice candidate to peer connection
   */
  async handleIceCandidate(fromDid: string, candidate: RTCIceCandidate) {
    const connection = this.connections.get(fromDid);
    // Make sure we have a remote description;
    if (connection && !connection.peerConnection.currentRemoteDescription) {
      console.log(
        "🔴 Skipping ICE candidate adding as currentRemoteDescription is ",
        connection.peerConnection.currentRemoteDescription
      );
    }
    if (connection && connection.peerConnection.currentRemoteDescription) {
      connection.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  /**
   * Send message via datachannel
   */
  async sendMessage(type: string, message: any, recepients?: string[]) {
    const data = JSON.stringify({
      type,
      message,
    });
    this.connections.forEach((e, key) => {
      if (!recepients || recepients.includes(key)) {
        if (e.dataChannel.readyState === "open") {
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

  /**
   * Close connection/datachannel and remove from connections array
   */
  closeConnection(did: string) {
    const connection = this.connections.get(did);

    if (connection) {
      connection.peerConnection.close();
      connection.dataChannel.close();

      // https://stackoverflow.com/questions/54282358/how-to-fully-clear-webrtc-connection
      connection.peerConnection = null;
      connection.dataChannel = null;

      this.connections.delete(did);
    }
  }

  /**
   * Add event to peer log
   */
  async addToEventLog(did: string, type: string, value?: string) {
    const event = {
      type,
      value,
      timeStamp: new Date().toISOString(),
    };

    // Check if this is a local event
    if (did === this.agent.did) {
      this.callbacks[Event.EVENT].forEach((cb) => {
        cb(this.agent.did, event);
      });

      this.localEventLog.push(event);
      return;
    }

    const connection = this.connections.get(did);
    if (!connection) {
      console.log("🔴 Failed to add log entry, no connection found!");
      return;
    }

    connection.eventLog.push(event);
  }

  /**
   * Join the chat room, listen for signals and begin heartbeat
   */
  async join(initialSettings?: Settings) {
    let settings = { audio: true, video: false, ...initialSettings };

    console.log("Start joining with settings: ", settings);

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: settings.audio,
      video: settings.video,
    });

    if (!this.addedListener) {
      await this.neighbourhood.addSignalHandler(this.onSignal);
      this.addedListener = true;
    }

    this.isListening = true;

    console.log("🟠 Sending JOIN broadcast");
    this.addToEventLog(this.agent.did, OFFER_REQUEST);

    this.broadcastOfferRequest();

    this.heartbeatId = setInterval(this.heartbeat, 10000);

    return this.localStream;
  }

  /**
   * Ask room for offer
   */
  async broadcastOfferRequest() {
    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: this.roomId,
          predicate: OFFER_REQUEST,
          target: this.agent.did,
        },
      ],
    });
  }

  /**
   * Leave the room and close all connections
   */
  async leave() {
    this.isListening = false;

    // Stop heartbeat
    clearInterval(this.heartbeatId);

    if (this.perspective) {
      // Todo: Nico, nico, nico!
      // this.neighbourhood.
    }

    // Announce departure
    this.addToEventLog(this.agent.did, LEAVE);
    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: this.roomId,
          predicate: LEAVE,
          target: "goodbye!", // could be empty
        },
      ],
    });

    // Close webrtc connections
    this.connections.forEach((c, key) => {
      this.closeConnection(key);
    });

    // Kill media recording
    this.localStream.getTracks().forEach((track) => track.stop());
  }

  async heartbeat() {
    console.log("💚 Sending HEARTBEAT");
    this.addToEventLog(this.agent.did, HEARTBEAT);

    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: this.roomId,
          predicate: HEARTBEAT,
          target: this.agent.did,
        },
      ],
    });
  }

  async getStats() {
    for (const c of this.connections) {
      const connection = this.connections.get(c[0]);
      const stats = await connection.peerConnection.getStats();

      let statsOutput = `⭐️ Stats for connection: ${c[0]}\n`;

      stats.forEach((report) => {
        statsOutput += `Report: ${report.type} - ${report.id} (${report.timestamp})\n`;
        statsOutput += `---------------------------------\n`;

        Object.keys(report).forEach((statName) => {
          if (
            statName !== "id" &&
            statName !== "timestamp" &&
            statName !== "type"
          ) {
            statsOutput += `${statName}: ${report[statName]}\n`;
          }
        });
      });

      console.log(statsOutput);
    }
  }

  async sendTestSignal(recipientDid: string) {
    console.log("⚙️ Sending TEST_SIGNAL to ", recipientDid);
    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: this.roomId,
          predicate: TEST_SIGNAL,
          target: recipientDid,
        },
      ],
    });
  }

  async sendTestBroadcast() {
    console.log("⚙️ Sending TEST_BROADCAST to room");
    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: this.roomId,
          predicate: TEST_BROADCAST,
          target: Literal.from("test broadcast").toUrl(),
        },
      ],
    });
  }
}
