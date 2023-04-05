import SimplePeer from "simple-peer/simplepeer.min.js";
import { Literal, NeighbourhoodProxy } from "@perspect3vism/ad4m";

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

export interface AD4MPeerInstance extends SimplePeer.Instance {
  // WIP
}

export type Props = {
  did: string;
  source: string;
  neighbourhood: NeighbourhoodProxy;
  initiator: boolean;
  stream: MediaStream;
  options?: SimplePeer.Options;
};

export class AD4MPeer {
  public peer: SimplePeer.Instance;
  private did: string;
  private initiator: boolean;
  private source: string;
  private stream: MediaStream;
  private neighbourhood: NeighbourhoodProxy;
  private options?: SimplePeer.Options;

  constructor(props: Props) {
    this.did = props.did;
    this.initiator = props.initiator;
    this.source = props.source;
    this.stream = props.stream;
    this.neighbourhood = props.neighbourhood;
    this.options = props.options
      ? props.options
      : {
          config: { iceServers },
        };

    this.peer = this.createPeer();

    return this.peer;
  }

  private createPeer() {
    console.log("createPeer(): initiator: %s, %s", this.initiator, this.did);

    const peer = new SimplePeer({
      initiator: this.initiator,
      stream: this.stream,
      ...this.options,
      trickle: false,
    });

    // Local peerjs instance has data it wants to send to remote peer
    peer.on("signal", (signal) => {
      console.log("🔵 sending ", signal.type, " to ", this.did);

      const data = {
        signalData: signal,
        targetPeer: this.did,
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
