export type WindowState = "minimize" | "visible" | "foreground";

export interface ToastState {
  variant: "success" | "" | "danger" | "error";
  message: string;
  open: boolean;
}

export type CurrentThemeState = "global" | string;

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

export type UpdateState =
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "checking";
