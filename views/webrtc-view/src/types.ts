import { Settings, Connection } from "@coasys/flux-webrtc";

export type Peer = {
  did: string;
  connection: Connection;
  settings: Settings;
};

export type Reaction = {
  did: string;
  reaction: string;
};
