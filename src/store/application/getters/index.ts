import { ApplicationState, ExpressionUIIcons } from "@/store/types";

export default {
  getLanguagePath(state: ApplicationState): string {
    return state.localLanguagesPath;
  },

  getApplicationStartTime(state: ApplicationState): Date {
    return state.applicationStartTime;
  },

  getLanguageUI:
    (state: ApplicationState) =>
    (language: string): ExpressionUIIcons => {
      return state.expressionUI[language];
    },
};
