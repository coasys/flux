import { Settings, EventLogItem } from "utils/helpers";

export type peerState = {
  spriteIndex: number;
  isDrawing: boolean;
  x: number;
  y: number;
};

export type Peer = {
  did: string;
  connection: {
    peerConnection: RTCPeerConnection;
    dataChannel: RTCDataChannel;
    mediaStream: MediaStream;
    eventLog: EventLogItem[];
  };
  settings: Settings;
  state: peerState;
};
