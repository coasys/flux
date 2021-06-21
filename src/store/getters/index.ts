import {
  State,
  CommunityState,
  ExpressionUIIcons,
  ChannelState,
  Profile,
} from "@/store";
import Address from "@perspect3vism/ad4m/Address";

export default {
  //Dump the whole state
  dumpState(state: State) {
    return state;
  },
  getProfile(state: State) {
    return state.userProfile;
  },
  // Get the list of communities a user is a part of
  getCommunities(state: State) {
    return state.communities;
  },

  getLanguagePath(state: State) {
    return state.localLanguagesPath;
  },

  getCommunity: (state: State) => (id: string) => {
    const community = state.communities[id];

    return community;
  },

  getChannel: (state: State) => (payload: any) => {
    const { channelId, communityId } = payload;
    const community = state.communities[communityId];

    return community?.channels[channelId];
  },

  getDatabasePerspective(state: State) {
    return state.databasePerspective;
  },

  getPerspectiveFromLinkLanguage: (state: State) => (linkLanguage: string) => {
    let perspective;

    for (const community of Object.values(state.communities)) {
      if (community.linkLanguageAddress == linkLanguage) {
        return community;
      }

      for (const channel of Object.values(community.channels)) {
        if (channel.linkLanguageAddress == linkLanguage) {
          perspective = channel;
        }
      }
    }

    return perspective;
  },

  getAllExpressionLanguagesNotLoaded(state: State): Address[] {
    const expressionLangs: Address[] = [];

    for (const community of Object.values(state.communities)) {
      for (const expLang of community.expressionLanguages) {
        if (
          expressionLangs.indexOf(expLang) === -1 &&
          //@ts-ignore
          state.expressionUI.find(
            (val: ExpressionUIIcons) => val.languageAddress === expLang
          ) === undefined
        ) {
          expressionLangs.push(expLang);
        }
      }
    }

    return expressionLangs;
  },

  getAgentLockStatus(state: State): boolean {
    return state.agentUnlocked;
  },

  getAgentInitStatus(state: State): boolean {
    return state.agentInit;
  },

  getApplicationStartTime(state: State): Date {
    return state.applicationStartTime;
  },
};
