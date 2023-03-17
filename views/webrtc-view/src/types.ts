import { Settings } from "utils/helpers/WebRTCManager";

export type Peer = {
  did: string;
  connection: {
    peerConnection: RTCPeerConnection;
    dataChannel: RTCDataChannel;
  };
  settings: Settings;
};

export type Reaction = {
  did: string;
  reaction: string;
};
