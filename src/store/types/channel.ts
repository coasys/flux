export interface ChannelState {
  id: string;
  name: string;
  creatorDid: string;
  description?: string;
  sourcePerspective: string;
  hasNewMessages: boolean;
  createdAt: string;
  scrollTop?: number;
  feedType: FeedType;
  notifications: {
    mute: boolean;
  };
}

export enum FeedType {
  Signaled,
  Static,
}
