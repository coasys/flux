import { ApplicationState, WindowState } from "@/store/types";

export default {
  getLanguagePath(state: ApplicationState): string {
    return state.localLanguagesPath;
  },

  getApplicationStartTime(state: ApplicationState): Date {
    return state.applicationStartTime;
  },

  getWindowState(state: ApplicationState): WindowState {
    return state.windowState;
  },
};
