export interface ChannelState {
  id: string;
  name: string;
  creatorDid: string;
  description?: string;
  sourcePerspective: string;
  hasNewMessages: boolean;
  createdAt: string;
  scrollTop?: number;
  notifications: {
    mute: boolean;
  };
}