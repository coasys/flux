import { UserState } from "./userprofile";
import { ExpressionUIIcons } from "./expression";
import { LocalCommunityState } from "./community";
import { LocalChannelState } from "./channel";
import { NeighbourhoodState } from "./neighbourhood";
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
  channels: { [perspectiveUuid: string]: LocalChannelState };
  neighbourhoods: { [perspectiveUuid: string]: NeighbourhoodState };
}

export interface ApplicationState {
  expressionUI: { [x: string]: ExpressionUIIcons };
  localLanguagesPath: string;
  windowState: WindowState;
  toast: ToastState;
  applicationStartTime: Date;
  updateState: UpdateState;
  globalTheme: ThemeState;
  currentTheme: CurrentThemeState;
  modals: ModalsState;
  showSidebar: boolean;
  sidebarWidth: number;
  showGlobalLoading: boolean;
  globalError: {
    show: boolean;
    message: string;
  };
}
