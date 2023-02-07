export type Peer = {
  did: string;
  connection: {
    peerConnection: RTCPeerConnection;
    dataChannel: RTCDataChannel;
  };
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
