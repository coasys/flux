import { ChannelView } from "@fluxapp/types";
export interface ChannelState {
  id: string;
  name: string;
  author: string;
  description?: string;
  sourcePerspective: string;
  hasNewMessages: boolean;
  timestamp: Date | string;
  expanded: boolean;
  currentView: ChannelView;
  views: ChannelView[];
  notifications: {
    mute: boolean;
  };
}
