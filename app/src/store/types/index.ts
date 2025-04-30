import { AgentStatus } from "@coasys/ad4m";
import { Profile } from "@coasys/flux-types";

export type CurrentTheme = "global" | string;
export type WindowState = "minimize" | "visible" | "foreground";
export type UpdateState = "available" | "not-available" | "downloading" | "downloaded" | "checking";
export interface ToastState {
  variant: "success" | "" | "danger" | "error";
  message: string;
  open: boolean;
}

export interface ThemeState {
  name: string;
  fontFamily: string;
  hue: number;
  saturation: number;
  fontSize: string;
}

export interface ModalsState {
  showCreateCommunity: boolean;
  showEditCommunity: boolean;
  showEditChannel: boolean;
  showCommunityMembers: boolean;
  showCreateChannel: boolean;
  showEditProfile: boolean;
  showSettings: boolean;
  showCommunitySettings: boolean;
  showCommunityTweaks: boolean;
  showInviteCode: boolean;
  showDisclaimer: boolean;
  showLeaveCommunity: boolean;
}

export interface ApplicationState {
  windowState: WindowState;
  toast: ToastState;
  updateState: UpdateState;
  globalTheme: ThemeState;
  currentTheme: CurrentTheme;
  activeCommunity: string;
  activeChannel: string;
  modals: ModalsState;
  showSidebar: boolean;
  showMainSidebar: boolean;
  sidebarWidth: number;
  showGlobalLoading: boolean;
  globalError: { show: boolean; message: string };
  notification: { globalNotification: boolean };
  activeWebrtc: { instance: any; channelId: string };
}

export interface State {
  app: ApplicationState;
}

// Currently unused
export interface UserState {
  agent: AgentStatus;
  profile: Profile | null;
  agentProfileProxyPerspectiveId?: string;
}
