export interface ChannelState {
  id: string;
  name: string;
  author: string;
  description?: string;
  sourcePerspective: string;
  hasNewMessages: boolean;
  timestamp: Date | string;
  currentView: string;
  views: string[];
  scrollTop?: number;
  notifications: {
    mute: boolean;
  };
}
