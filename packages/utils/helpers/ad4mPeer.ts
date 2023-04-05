import SimplePeer from "simple-peer/simplepeer.min.js";
import { EventEmitter } from "events";
import {
  Ad4mClient,
  PerspectiveProxy,
  Agent,
  Literal,
  NeighbourhoodProxy,
  PerspectiveExpression,
} from "@perspect3vism/ad4m";

const iceServers = [
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
];

async function getLinkFromPerspective(expression: PerspectiveExpression) {
  try {
    return expression.data.links[0];
  } catch (e) {
    return null;
  }
}

export interface AD4MPeerInstance extends SimplePeer.Instance {
  /**
   * The peer id of the initiator of the connection
   */
  initiatorId: string | null;
  /**
   * The peer id of the receiver of the connection
   */
  receiverId: string | null;
}

export interface Signal extends SimplePeer.SignalData {
  type: "offer" | "answer" | "error";
  /**
   * The id of the peer where the signal came from
   */
  id: string;
}

export type SignalInterceptor = (
  signal: Signal
) => Promise<Signal> | Signal | null;

export declare interface AD4MPeer {
  /**
   * Triggered when a new connection is established either initiated by you through [[FirePeer.connect]]
   * or initiated by another peer.
   */
  on(event: "connection", listener: (peer: AD4MPeerInstance) => void): this;
  /**
   * Triggered when a connection failed either through [[FirePeer.connect]]
   * or initiated by another peer.
   */
  on(event: "connection_failed", listener: (error: Error) => void): this;
}

export type Props = {
  client: Ad4mClient;
  uuid: string;
  source: string;
  options?: SimplePeer.Options;
};

export class AD4MPeer extends EventEmitter {
  /**
   * A unique string identifying this peer from other peers. Used as the `id` parameter in [[FirePeer.connect]].
   */
  public did: string;
  private client: Ad4mClient;
  private agent: Agent;
  private perspective: PerspectiveProxy | null;
  private neighbourhood: NeighbourhoodProxy;
  private options: SimplePeer.Options;

  constructor(props: Props) {
    super();
    this.client = props.client;
    this.options = props.options
      ? props.options
      : {
          config: { iceServers },
        };

    this.init(props);
  }

  async init(props: Props) {
    this.agent = await this.client.agent.me();
    this.perspective = await this.client.perspective.byUUID(props.uuid);
    this.neighbourhood = new NeighbourhoodProxy(
      this.client.neighbourhood,
      this.perspective ? this.perspective.uuid : ""
    );
  }

  /**
   * Connect to a peer identified by a user did and peer did. Returns a promise that resolves to a [[AD4MPeerInstance]].
   */
  public connect(did: string, initiator: boolean): Promise<AD4MPeerInstance> {
    return new Promise((resolve, reject) => {
      console.log("connecting to %s", did);

      const peer = this.createPeer(did, initiator);

      peer.on("connect", () => {
        resolve(peer);
      });

      peer.on("_connect_error", (err) => {
        reject(err);
      });
    });
  }

  private async createPeer(
    did: string,
    initiator: boolean
  ): Promise<AD4MPeerInstance> {
    console.log("createPeer(): initiator: %s, %s", initiator, did);

    console.log("⚙️ Simplepeer options: ", this.options);

    const peer = new SimplePeer({
      initiator,
      ...this.options,
      trickle: false,
    }) as AD4MPeerInstance;

    // Local peerjs instance has data it wants to send to remote peer
    peer.on("signal", (signal: Signal) => {
      console.log("🔵 sending ", signal.type, " to ", did);

      this.neighbourhood.sendBroadcastU({
        links: [
          {
            source: this.perspective?.uuid || "",
            predicate: "signal",
            target: Literal.from(signal).toUrl(),
          },
        ],
      });
    });

    // Listen to events from remote peer
    await this.neighbourhood.addSignalHandler(async (expression) => {
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
        return;
      }

      const signal = Literal.fromUrl(link.data.target).get();
      peer.signal(signal);
    });

    const cleanup = () => {
      console.log("cleanup");
    };

    peer.on("error", (err) => {
      console.log(err.message);
      cleanup();
    });

    peer.on("close", cleanup);

    peer.on("connect", () => {
      console.log("connection established");

      cleanup();

      // peer.initiatorId = initiatorId;
      // peer.receiverId = receiverId;

      this.emit("connection", peer);
    });

    return peer;
  }
}
