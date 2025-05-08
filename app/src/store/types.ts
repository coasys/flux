import { Agent } from "@coasys/ad4m";
import { Community } from "@coasys/flux-api";
import { RouteParams } from "@coasys/flux-types";

export type WindowState = "minimize" | "visible" | "foreground";
export type UpdateState = "available" | "not-available" | "downloading" | "downloaded" | "checking";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export interface ToastState {
  variant?: "success" | "danger" | "error";
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

export interface AppStore {
  me: Agent;
  myCommunities: Record<string, Community>;
  updateState: UpdateState;
  toast: ToastState;
  notification: { globalNotification: boolean };
  activeWebrtc: { instance: RTCPeerConnection | undefined; channelId: string };
  callRoute: RouteParams | null;
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
