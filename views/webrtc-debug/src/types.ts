import { Settings } from "./WebRTCManager";

export type peerState = {
  spriteIndex: number;
  x: number;
  y: number;
};

export type Peer = {
  did: string;
  connection: {
    peerConnection: RTCPeerConnection;
    dataChannel: RTCDataChannel;
  };
  settings: Settings;
  state: peerState;
};
