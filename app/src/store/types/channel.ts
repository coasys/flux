import { FluxApp } from "@/utils/npmApi";
export interface ChannelState {
  id: string;
  name: string;
  author: string;
  description?: string;
  sourcePerspective: string;
  hasNewMessages: boolean;
  timestamp: Date | string;
  expanded: boolean;
  currentView: string;
  views: FluxApp[];
  notifications: {
    mute: boolean;
  };
}
