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
  fontSize: "sm" | "md" | "lg";
}

export interface ModalsState {
  showCreateCommunity: boolean;
  showEditCommunity: boolean;
  showCommunityMembers: boolean;
  showCreateChannel: boolean;
  showEditProfile: boolean;
  showSettings: boolean;
  showCommunitySettings: boolean;
  showInviteCode: boolean;
  showDisclaimer: boolean;
}

export type UpdateState =
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "checking";
