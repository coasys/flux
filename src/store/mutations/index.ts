import { parseExprURL } from "@perspect3vism/ad4m/ExpressionRef";
import type Expression from "@perspect3vism/ad4m/Expression";
import ad4m from "@perspect3vism/ad4m-executor";
import hash from "object-hash";

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
  links: { [x: string]: LinkExpressionAndLang };
  expressions: { [x: string]: ExpressionAndRef };
}

interface AddChannelMessage {
  channelId: string;
  communityId: string;
  link: ad4m.LinkExpression;
  expression: ad4m.Expression;
  linkLanguage: string;
}

export default {
  addMessages(state: State, payload: AddChannelMessages): void {
    const community = state.communities[payload.communityId];
    const channel = community?.channels[payload.channelId];
    console.log(
      "Adding ",
      Object.values(payload.links).length,
      " to channel and ",
      Object.values(payload.expressions).length,
      " to channel"
    );
    channel.currentExpressionLinks = {
      ...channel.currentExpressionLinks,
      ...payload.links,
    };
    channel.currentExpressionMessages = {
      ...channel.currentExpressionMessages,
      ...payload.expressions,
    };
  },
  addMessage(state: State, payload: AddChannelMessage): void {
    const community = state.communities[payload.communityId];
    const channel = community?.channels[payload.channelId];

    channel.currentExpressionLinks[
      hash(payload.link.data!, { excludeValues: "__typename" })
    ] = {
      expression: payload.link,
      language: payload.linkLanguage,
    } as LinkExpressionAndLang;
    channel.currentExpressionMessages[payload.expression.url!] = {
      expression: {
        author: payload.expression.author!,
        data: JSON.parse(payload.expression.data!),
        timestamp: payload.expression.timestamp!,
        proof: payload.expression.proof!,
      } as Expression,
      url: parseExprURL(payload.link.data!.target!),
    };
  },
  addCommunity(state: State, payload: CommunityState): void {
    console.log("adding Community", payload);
    state.communities[payload.perspective] = payload;
  },
  setLanguagesPath(state: State, payload: string): void {
    state.localLanguagesPath = payload;
  },
  addDatabasePerspective(state: State, payload: string): void {
    state.databasePerspective = payload;
  },
  addExpressionAndLinkFromLanguageAddress: (
    state: State,
    payload: {
      linkLanguage: string;
      link: ad4m.LinkExpression;
      message: ad4m.Expression;
    }
  ): void => {
    for (const community of Object.values(state.communities)) {
      for (const channel of Object.values(community.channels)) {
        if (channel.linkLanguageAddress === payload.linkLanguage) {
          console.log("Adding to link and exp to channel!");
          channel.currentExpressionLinks[
            hash(payload.link.data!, { excludeValues: "__typename" })
          ] = {
            expression: payload.link,
            language: payload.linkLanguage,
          } as LinkExpressionAndLang;
          //TODO: make gql expression to ad4m expression conversion function
          channel.currentExpressionMessages[payload.message.url!] = {
            expression: {
              author: payload.message.author!,
              data: JSON.parse(payload.message.data!),
              timestamp: payload.message.timestamp!,
              proof: payload.message.proof!,
            } as Expression,
            url: parseExprURL(payload.link.data!.target!),
          } as ExpressionAndRef;
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
    state.expressionUI[payload.languageAddress] = payload;
  },

  updateApplicationStartTime(state: State, payload: Date): void {
    state.applicationStartTime = payload;
  },

  addChannel(state: State, payload: AddChannel): void {
    const community = state.communities[payload.communityId];

    if (community !== undefined) {
      community.channels[payload.channel.perspective] = {
        ...payload.channel,
        hasNewMessages: false,
      };
    }
  },

  setHasNewMessages(
    state: State,
    payload: { channelId: string; value: boolean }
  ): void {
    //console.log(payload);
    for (const community of Object.values(state.communities)) {
      for (const channel of Object.values(community.channels)) {
        //console.log(channel);
        if (channel.perspective === payload.channelId) {
          //console.log({ channel });
          channel.hasNewMessages = payload.value;
        }
      }
    }
  },

  createProfile(
    state: State,
    { profile, did }: { profile: Profile; did: string }
  ): void {
    state.userProfile = profile;
    state.userDid = did;
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
    state.ui.theme = { ...state.ui.theme, ...payload };
  },

  toggleSidebar(state: State): void {
    state.ui.showSidebar = !state.ui.showSidebar;
  },

  setSidebar(state: State, open: boolean): void {
    state.ui.showSidebar = open;
  },

  setChannelScrollTop(
    state: State,
    payload: { channelId: string; communityId: string; value: number }
  ): void {
    state.communities[payload.communityId].channels[
      payload.channelId
    ].scrollTop = payload.value;
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

  setGlobalError(
    state: State,
    payload: { show: boolean; message: string }
  ): void {
    state.ui.globalError = payload;
  },

  setCurrentChannelId(
    state: State,
    payload: { communityId: string; channelId: string }
  ): void {
    const { communityId, channelId } = payload;
    state.communities[communityId].currentChannelId = channelId;
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

  setShowInviteCode(state: State, payload: boolean): void {
    state.ui.modals.showInviteCode = payload;
  },

  setChannelNotificationState(
    state: State,
    { communityId, channelId }: { communityId: string; channelId: string }
  ): void {
    console.log(state.communities[communityId], communityId);

    const channel = state.communities[communityId].channels[channelId];

    channel.notifications.mute = !channel.notifications.mute;
  },

  setWindowState(
    state: State,
    payload: "minimize" | "visible" | "foreground"
  ): void {
    state.windowState = payload;
  },
};
