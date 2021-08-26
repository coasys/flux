import { NeighbourhoodState } from "./neighbourhood";

export interface LocalChannelState {
  perspectiveUuid: string;
  hasNewMessages: boolean;
  scrollTop?: number;
  feedType: FeedType;
  notifications: {
    mute: boolean;
  };
}

export interface ChannelState {
  neighbourhood: NeighbourhoodState;
  state: LocalChannelState;
}

export enum FeedType {
  Signaled,
  Static,
}
