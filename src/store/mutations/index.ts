import { parseExprURL } from "@perspect3vism/ad4m/ExpressionRef";

import {
  State,
  CommunityState,
  ExpressionAndLang,
  ExpressionAndRef,
  AddChannel,
  Profile,
  ToastState,
  ExpressionUIIcons,
  ThemeState,
} from "@/store";

interface UpdatePayload {
  communityId: string;
  name: string;
  description: string;
  groupExpressionRef: any;
}

export default {
  addCommunity(state: State, payload: CommunityState) {
    console.log("adding Community", payload);
    state.communities.push(payload);
  },
  setLanguagesPath(state: State, payload: string) {
    state.localLanguagesPath = payload;
  },
  addDatabasePerspective(state: State, payload: any) {
    state.databasePerspective = payload;
  },
  addExpressionAndLinkFromLanguageAddress: (state: State, payload: any) => {
    state.communities.forEach((community) => {
      community.channels.forEach((channel) => {
        if (channel.linkLanguageAddress === payload.linkLanguage) {
          console.log(
            new Date().toISOString(),
            "Adding to link and exp to channel!",
            payload
          );
          channel.currentExpressionLinks.push({
            expression: payload.link,
            language: payload.linkLanguage,
          } as ExpressionAndLang);
          channel.currentExpressionMessages.push({
            expression: payload.message,
            url: parseExprURL(payload.link.data.target),
          } as ExpressionAndRef);
        }
      });
    });
  },

  updateAgentLockState(state: State, payload: boolean) {
    state.agentUnlocked = payload;
  },

  updateAgentInitState(state: State, payload: boolean) {
    state.agentInit = payload;
  },

  addExpressionUI(state: State, payload: ExpressionUIIcons) {
    state.expressionUI.push(payload);
  },

  updateApplicationStartTime(state: State, payload: Date) {
    state.applicationStartTime = payload;
  },

  addChannel(state: State, payload: AddChannel) {
    console.log(payload);
    const community = state.communities.find(
      (community) => community.perspective === payload.communityId
    );
    if (community !== undefined) {
      community.channels.push(payload.channel);
    }
  },

  createProfile(state: State, payload: Profile): void {
    state.userProfile = payload;
  },

  setUserProfile(state: State, payload: Profile): void {
    state.userProfile = { ...state.userProfile, ...payload };
  },

  setToast(state: State, payload: ToastState): void {
    state.ui.toast = { ...state.ui.toast, ...payload };
  },

  showSuccessToast(state: State, payload: { message: string }): void {
    state.ui.toast = { variant: "success", open: true, ...payload };
  },

  showDangerToast(state: State, payload: { message: string }): void {
    state.ui.toast = { variant: "danger", open: true, ...payload };
  },

  setTheme(state: State, payload: ThemeState): void {
    if (payload.hue) {
      document.documentElement.style.setProperty(
        "--j-color-primary-hue",
        payload.hue.toString()
      );
    }
    if (payload.name) {
      document.documentElement.setAttribute("theme", payload.name);
    }
    state.ui.theme = { ...state.ui.theme, ...payload };
  },

  updateCommunityMetadata(
    state: State,
    { communityId, name, description, groupExpressionRef }: UpdatePayload
  ): void {
    const community = state.communities.find(
      (community) => community.perspective === communityId
    );
    if (community != undefined) {
      community.name = name;
      community.description = description;
      community.groupExpressionRef = groupExpressionRef;
    }
  },

  setGlobalLoading(state: State, payload: boolean): void {
    state.ui.isGlobalLoading = payload;
  },
};
