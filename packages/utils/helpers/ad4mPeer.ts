import SimplePeer from "simple-peer/simplepeer.min.js";
import { Instance as SimplePeerInstance } from "simple-peer";
import { Literal, NeighbourhoodProxy } from "@perspect3vism/ad4m";

export interface AD4MPeerInstance extends SimplePeerInstance {
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
  public peer: AD4MPeerInstance;
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
    this.options = props.options ? props.options : {};
  }

  public connect() {
    this.peer = this.createPeer();
    return this.peer;
  }

  private createPeer(): AD4MPeerInstance {
    console.log("createPeer(): initiator: %s, %s", this.initiator, this.did);

    const peer = new SimplePeer({
      initiator: this.initiator,
      stream: this.stream,
      ...this.options,
      trickle: false,
    }) as SimplePeerInstance;

    // Local peerjs instance has data it wants to send to remote peer
    peer.on("signal", (signal) => {
      console.log("🔵 SIMPLE-PEER: sending ", signal.type, " to ", this.did);

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
