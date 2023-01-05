import { ChannelView } from "utils/types";
export interface ChannelState {
  id: string;
  name: string;
  author: string;
  description?: string;
  sourcePerspective: string;
  hasNewMessages: boolean;
  timestamp: Date | string;
  collapsed: boolean;
  currentView: ChannelView;
  views: ChannelView[];
  notifications: {
    mute: boolean;
  };
}
