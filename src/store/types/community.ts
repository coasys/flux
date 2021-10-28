import { NeighbourhoodState } from "./neighbourhood";
import { ThemeState } from "./ui";

export interface CommunityState {
  neighbourhood: NeighbourhoodState;
  state: LocalCommunityState;
}

export interface LocalCommunityState {
  perspectiveUuid: string;
  theme: ThemeState;
  useLocalTheme: boolean;
  currentChannelId: string | undefined | null;
  hasNewMessages: boolean;
  notifications: {
    mute: boolean;
  };
}
