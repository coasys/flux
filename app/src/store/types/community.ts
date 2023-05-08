import { PerspectiveState } from "@perspect3vism/ad4m";
import { Community } from "@fluxapp/types";
import { ThemeState } from "./ui";

export interface CommunityState {
  neighbourhood: Community;
  state: LocalCommunityState;
}

export interface LocalCommunityState {
  perspectiveUuid: string;
  theme: ThemeState;
  useLocalTheme: boolean;
  currentChannelId: string | undefined | null;
  hasNewMessages: boolean;
  collapseChannelList: boolean;
  hideMutedChannels: boolean;
  syncState: PerspectiveState | undefined;
  notifications: {
    mute: boolean;
  };
}
