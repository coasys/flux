import { Agent, AgentStatus } from "@coasys/ad4m";
import { Profile } from "@coasys/flux-types";

export type WindowState = "minimize" | "visible" | "foreground";
export type UpdateState = "available" | "not-available" | "downloading" | "downloaded" | "checking";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export interface ToastState {
  variant?: "" | "success" | "danger" | "error";
  message?: string;
  open: boolean;
}

export interface Theme {
  name: string;
  fontFamily: string;
  hue: number;
  saturation: number;
  fontSize: string;
}

export interface ModalsStore {
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

export interface ThemeStore {
  globalTheme: Theme;
  currentTheme: string;
}

export interface UIStore {
  showSidebar: boolean;
  showMainSidebar: boolean;
  sidebarWidth: number;
  showGlobalLoading: boolean;
  globalError: { show: boolean; message: string };
  windowState: WindowState;
}

export interface AppStore {
  me: Agent;
  updateState: UpdateState;
  toast: ToastState;
  activeCommunityId: string;
  activeChannelId: string;
  notification: { globalNotification: boolean };
  activeWebrtc: { instance: any; channelId: string };
}

// export interface State {
//   app: ApplicationState;
// }

// Currently unused
export interface UserState {
  agent: AgentStatus;
  profile: Profile | null;
  agentProfileProxyPerspectiveId?: string;
}
