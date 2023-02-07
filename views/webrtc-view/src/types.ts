export type Connection = {
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
};

export type Peer = {
  did: string;
  connection: Connection;
  settings: {
    video: boolean;
    audio: boolean;
    screen: boolean;
  };
};

export type Reaction = {
  did: string;
  reaction: string;
};
