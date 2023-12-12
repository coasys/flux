import * as SimplePeer from "simple-peer";

import { Literal, NeighbourhoodProxy } from "@perspect3vism/ad4m";

export interface AD4MPeerInstance extends SimplePeer.Instance {}

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
    const peer = new SimplePeer({
      initiator: this.initiator,
      stream: this.stream,
      ...this.options,
      trickle: false,
    });

    // Local peerjs instance has data it wants to send to remote peer
    peer.on("signal", (signal) => {
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
      cleanup();
    });

    peer.on("close", cleanup);

    peer.on("connect", () => {
      cleanup();
    });

    return peer;
  }
}
