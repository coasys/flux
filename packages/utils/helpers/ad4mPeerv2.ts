import SimplePeer from "simple-peer/simplepeer.min.js";
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

export type Props = {
  source: string;
  neighbourhood: NeighbourhoodProxy;
  initiator: boolean;
  options?: SimplePeer.Options;
};

export interface AD4MInstance extends SimplePeer.Instance {
  /**
   * The uid of the initiator of the connection
   */
  initiatorUid: string | null;
  /**
   * The peer id of the initiator of the connection
   */
  initiatorId: string | null;
  /**
   * The uid of the receiver of the connection
   */
  receiverUid: string | null;
  /**
   * The peer id of the receiver of the connection
   */
  receiverId: string | null;
}

export class AD4MPeer {
  /**
   * A unique string identifying this peer from other peers. Used as the `id` parameter in [[FirePeer.connect]].
   */
  public source: string;
  private neighbourhood: NeighbourhoodProxy;
  private options?: SimplePeer.Options;

  constructor(props: Props) {
    this.source = props.source;
    this.neighbourhood = props.neighbourhood;
    this.options = props.options
      ? props.options
      : {
          config: { iceServers },
        };
  }

  public connect(
    did: string,
    initiator: boolean,
    stream: MediaStream
  ): SimplePeer.Instance {
    return this.createPeer(did, initiator, stream);
  }

  private createPeer(did: string, initiator: boolean, stream: MediaStream) {
    console.log("createPeer(): initiator: %s, %s", initiator, did);

    console.log("⚙️ Simplepeer options: ", this.options);

    const peer = new SimplePeer({
      initiator,
      stream,
      ...this.options,
      trickle: false,
    });

    // Local peerjs instance has data it wants to send to remote peer
    peer.on("signal", (signal) => {
      console.log("🔵 sending ", signal.type, " to ", did);

      const data = {
        signalData: signal,
        targetPeer: did,
      };

      this.neighbourhood.sendBroadcastU({
        links: [
          {
            source: this.source,
            predicate: "peer-signal",
            target: Literal.from(data).toUrl(),
          },
        ],
      });
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
    });

    return peer;
  }
}
