import SimplePeer from "simple-peer/simplepeer.min.js";
import {
  Ad4mClient,
  PerspectiveProxy,
  Agent,
  Literal,
  NeighbourhoodProxy,
  PerspectiveExpression,
} from "@perspect3vism/ad4m";

export type Props = {
  did: string;
  source: string;
  neighbourhood: NeighbourhoodProxy;
  initiator: boolean;
  options?: SimplePeer.Options;
};

export class AD4MPeer {
  /**
   * A unique string identifying this peer from other peers. Used as the `id` parameter in [[FirePeer.connect]].
   */
  public did: string;
  public source: string;
  private neighbourhood: NeighbourhoodProxy;
  private options?: SimplePeer.Options;

  constructor(props: Props) {
    this.source = props.source;
    this.neighbourhood = props.neighbourhood;
    this.options = props.options ? props.options : {};

    return this.createPeer(props.did, props.initiator);
  }

  private createPeer(did: string, initiator: boolean) {
    console.log("createPeer(): initiator: %s, %s", initiator, did);

    const peer = new SimplePeer({
      initiator,
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

      // peer.initiatorId = initiatorId;
      // peer.receiverId = receiverId;

      this.emit("connection", peer);
    });

    return peer;
  }
}
