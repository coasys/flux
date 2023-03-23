import { Settings, EventLogItem } from "utils/helpers";

export type Peer = {
  did: string;
  connection: {
    peerConnection: RTCPeerConnection;
    dataChannel: RTCDataChannel;
    mediaStream: MediaStream;
    eventLog: EventLogItem[];
  };
  settings: Settings;
};

export type Reaction = {
  did: string;
  reaction: string;
};
