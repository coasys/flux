import { UserState } from "./userprofile";
import { LocalCommunityState } from "./community";
import { ChannelState } from "./channel";
import { Community } from "utils/types";
import {
  WindowState,
  ModalsState,
  CurrentThemeState,
  ToastState,
  ThemeState,
  UpdateState,
} from "./ui";

export interface State {
  app: ApplicationState;
  data: DataState;
  user: UserState;
}

export interface DataState {
  communities: { [perspectiveUuid: string]: LocalCommunityState };
  channels: { [communityId: string]: ChannelState };
  neighbourhoods: { [perspectiveUuid: string]: Community };
}

export interface ApplicationState {
  windowState: WindowState;
  toast: ToastState;
  updateState: UpdateState;
  globalTheme: ThemeState;
  currentTheme: CurrentThemeState;
  modals: ModalsState;
  showSidebar: boolean;
  showMainSidebar: boolean;
  sidebarWidth: number;
  showGlobalLoading: boolean;
  globalError: {
    show: boolean;
    message: string;
  };
  notification: {
    globalNotification: boolean;
  };
}
