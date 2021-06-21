import { parseExprURL } from "@perspect3vism/ad4m/ExpressionRef";
import type Expression from "@perspect3vism/ad4m/Expression";
import { getExpressionAndRetry } from "@/core/queries/getExpression";

import {
  State,
  CommunityState,
  LinkExpressionAndLang,
  ExpressionAndRef,
  AddChannel,
  Profile,
  ToastState,
  ExpressionUIIcons,
  ThemeState,
  UpdateState,
} from "@/store";

interface UpdatePayload {
  communityId: string;
  name: string;
  description: string;
  groupExpressionRef: any;
}

interface AddChannelMessages {
  channelId: string;
  communityId: string;
  links: Expression[];
}

export default {
  async addMessagesIfNotPresent(
    state: State,
    payload: AddChannelMessages
  ): Promise<void> {
    const community = state.communities[payload.communityId];
    const channel = community?.channels[payload.channelId];
    const links = [];
    const expressions = [];

    if (channel) {
      for (const link of payload.links) {
        const currentExpressionLink = channel.currentExpressionLinks.find(
          (channelLink) =>
            //@ts-ignore
            channelLink.expression.data!.target === link.data.target
        );

        if (!currentExpressionLink) {
          console.log("Adding link to channel");
          links.push({
            expression: link,
            language: channel.linkLanguageAddress,
          } as LinkExpressionAndLang);
          const expression = await getExpressionAndRetry(
            //@ts-ignore
            link.data.target,
            50,
            20
          );
          if (expression) {
            console.log("Adding expression to channel");
            //@ts-ignore
            expressions.push({
              //@ts-ignore
              expression: expression,
              //@ts-ignore
              url: parseExprURL(link.data.target),
            } as ExpressionAndRef);
          }
        }
      }

      channel.currentExpressionLinks = [
        ...channel.currentExpressionLinks,
        ...links,
      ];
      channel.currentExpressionMessages = [
        ...channel.currentExpressionMessages,
        ...expressions,
      ];
    }
  },
  addCommunity(state: State, payload: CommunityState): void {
    console.log("adding Community", payload);
    state.communities[payload.perspective] = payload;
  },
  setLanguagesPath(state: State, payload: string): void {
    state.localLanguagesPath = payload;
  },
  addDatabasePerspective(state: State, payload: any): void {
    state.databasePerspective = payload;
  },
  addExpressionAndLinkFromLanguageAddress: (
    state: State,
    payload: any
  ): void => {
    for (const community of Object.values(state.communities)) {
      for (const channel of Object.values(community.channels)) {
        if (channel.linkLanguageAddress === payload.linkLanguage) {
          console.log("Adding to link and exp to channel!");
          channel.currentExpressionLinks.push({
            expression: payload.link,
            language: payload.linkLanguage,
          } as LinkExpressionAndLang);
          channel.currentExpressionMessages.push({
            expression: payload.message,
            url: parseExprURL(payload.link.data.target),
          } as ExpressionAndRef);
        }
      }
    }
  },

  updateAgentLockState(state: State, payload: boolean): void {
    state.agentUnlocked = payload;
  },

  updateAgentInitState(state: State, payload: boolean): void {
    state.agentInit = payload;
  },

  addExpressionUI(state: State, payload: ExpressionUIIcons): void {
    state.expressionUI.push(payload);
  },

  updateApplicationStartTime(state: State, payload: Date): void {
    state.applicationStartTime = payload;
  },

  addChannel(state: State, payload: AddChannel): void {
    const community = state.communities[payload.communityId];

    if (community !== undefined) {
      community.channels[payload.channel.perspective] = payload.channel;
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

  toggleSidebar(state: State): void {
    state.ui.showSidebar = !state.ui.showSidebar;
  },

  setSidebar(state: State, open: boolean): void {
    state.ui.showSidebar = open;
  },

  updateCommunityMetadata(
    state: State,
    { communityId, name, description, groupExpressionRef }: UpdatePayload
  ): void {
    const community = state.communities[communityId];

    if (community) {
      community.name = name;
      community.description = description;
      community.groupExpressionRef = groupExpressionRef;
    }

    state.communities[communityId] = community;
  },

  updateUpdateState(
    state: State,
    { updateState }: { updateState: UpdateState }
  ): void {
    state.updateState = updateState;
  },
  setCommunityMembers(
    state: State,
    { members, communityId }: { members: Expression[]; communityId: string }
  ): void {
    const community = state.communities[communityId];

    if (community) {
      community.members = members;
    }
  },
  setGlobalLoading(state: State, payload: boolean): void {
    state.ui.showGlobalLoading = payload;
  },

  setShowCreateCommunity(state: State, payload: boolean): void {
    state.ui.modals.showCreateCommunity = payload;
  },

  setShowEditCommunity(state: State, payload: boolean): void {
    state.ui.modals.showEditCommunity = payload;
  },

  setShowCommunityMembers(state: State, payload: boolean): void {
    state.ui.modals.showCommunityMembers = payload;
  },

  setShowCreateChannel(state: State, payload: boolean): void {
    state.ui.modals.showCreateChannel = payload;
  },

  setShowEditProfile(state: State, payload: boolean): void {
    state.ui.modals.showEditProfile = payload;
  },

  setShowSettings(state: State, payload: boolean): void {
    state.ui.modals.showSettings = payload;
  },
};
