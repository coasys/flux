export interface ChannelState {
  id: string;
  name: string;
  creatorDid: string;
  description?: string;
  sourcePerspective: string;
  hasNewMessages: boolean;
  createdAt: Date | string;
  currentView: string;
  views: string[];
  scrollTop?: number;
  notifications: {
    mute: boolean;
  };
}
