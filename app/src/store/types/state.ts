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
}

export interface ApplicationState {
  windowState: WindowState;
  toast: ToastState;
  updateState: UpdateState;
  globalTheme: ThemeState;
  currentTheme: CurrentThemeState;
  activeCommunity: string;
  activeChannel: string;
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
