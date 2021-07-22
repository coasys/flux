import {
  ApplicationState,
  UpdateState,
  ToastState,
  ThemeState,
  CurrentThemeState,
  ExpressionUIIcons,
} from "@/store/types";

export default {
  getLanguagePath(state: ApplicationState): string {
    return state.localLanguagesPath;
  },

  getDatabasePerspective(state: ApplicationState): string {
    return state.databasePerspective;
  },

  getApplicationStartTime(state: ApplicationState): Date {
    return state.applicationStartTime;
  },

  getLanguageUI: (state: ApplicationState) => (language: string) => {
    return state.expressionUI[language];
  },
  addExpressionUI(state: ApplicationState, payload: ExpressionUIIcons): void {
    state.expressionUI[payload.languageAddress] = payload;
  },
  setLanguagesPath(state: ApplicationState, payload: string): void {
    state.localLanguagesPath = payload;
  },
  setDatabasePerspective(state: ApplicationState, payload: string): void {
    state.databasePerspective = payload;
  },
  setApplicationStartTime(state: ApplicationState, payload: Date): void {
    state.applicationStartTime = payload;
  },
  toggleSidebar(state: ApplicationState): void {
    state.showSidebar = !state.showSidebar;
  },
  setSidebar(state: ApplicationState, open: boolean): void {
    state.showSidebar = open;
  },
  setCurrentTheme(state: ApplicationState, payload: CurrentThemeState): void {
    state.currentTheme = payload;
  },
  setGlobalTheme(state: ApplicationState, payload: ThemeState): void {
    state.globalTheme = { ...state.globalTheme, ...payload };
  },
  setToast(state: ApplicationState, payload: ToastState): void {
    state.toast = { ...state.toast, ...payload };
  },
  showSuccessToast(
    state: ApplicationState,
    payload: { message: string }
  ): void {
    state.toast = { variant: "success", open: true, ...payload };
  },
  showDangerToast(state: ApplicationState, payload: { message: string }): void {
    state.toast = { variant: "danger", open: true, ...payload };
  },
  setWindowState(
    state: ApplicationState,
    payload: "minimize" | "visible" | "foreground"
  ): void {
    state.windowState = payload;
  },
  setUpdateState(
    state: ApplicationState,
    { updateState }: { updateState: UpdateState }
  ): void {
    state.updateState = updateState;
  },
  setGlobalLoading(state: ApplicationState, payload: boolean): void {
    state.showGlobalLoading = payload;
  },
  setGlobalError(
    state: ApplicationState,
    payload: { show: boolean; message: string }
  ): void {
    state.globalError = payload;
  },
  setShowCreateCommunity(state: ApplicationState, payload: boolean): void {
    state.modals.showCreateCommunity = payload;
  },
  setShowEditCommunity(state: ApplicationState, payload: boolean): void {
    state.modals.showEditCommunity = payload;
  },
  setShowCommunityMembers(state: ApplicationState, payload: boolean): void {
    state.modals.showCommunityMembers = payload;
  },
  setShowCreateChannel(state: ApplicationState, payload: boolean): void {
    state.modals.showCreateChannel = payload;
  },
  setShowEditProfile(state: ApplicationState, payload: boolean): void {
    state.modals.showEditProfile = payload;
  },
  setShowDisclaimer(state: ApplicationState, payload: boolean): void {
    state.modals.showDisclaimer = payload;
  },
  setShowSettings(state: ApplicationState, payload: boolean): void {
    state.modals.showSettings = payload;
  },
  setShowCommunitySettings(state: ApplicationState, payload: boolean): void {
    state.modals.showCommunitySettings = payload;
  },
  setShowInviteCode(state: ApplicationState, payload: boolean): void {
    state.modals.showInviteCode = payload;
  },
};
