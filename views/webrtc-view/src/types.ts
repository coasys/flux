import { Settings, Connection } from "utils/helpers/WebRTCManager";

export type Peer = {
  did: string;
  connection: Connection;
  settings: Settings;
};

export type Reaction = {
  did: string;
  reaction: string;
};
