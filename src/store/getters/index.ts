import {
  State,
  CommunityState,
  ChannelState,
  Profile,
} from "@/store";

export default {
  //Dump the whole state
  dumpState(state: State): State {
    return state;
  },
  getProfile(state: State): Profile | null {
    return state.userProfile;
  },
  // Get the list of communities a user is a part of
  getCommunities(state: State): { [x: string]: CommunityState } {
    return state.communities;
  },

  getLanguagePath(state: State): string {
    return state.localLanguagesPath;
  },

  getCommunity:
    (state: State) =>
    (id: string): CommunityState => {
      const community = state.communities[id];

      return community;
    },

  getChannel:
    (state: State) =>
    (payload: any): ChannelState => {
      const { channelId, communityId } = payload;
      const community = state.communities[communityId];

      return community?.channels[channelId];
    },

  getDatabasePerspective(state: State): string {
    return state.databasePerspective;
  },

  getChannelFromLinkLanguage:
    (state: State) =>
    (linkLanguage: string): ChannelState | undefined => {
      for (const community of Object.values(state.communities)) {
        for (const channel of Object.values(community.channels)) {
          if (channel.linkLanguageAddress == linkLanguage) {
            return channel;
          }
        }
      }
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

  getAgentLockStatus(state: State): boolean {
    return state.agentUnlocked;
  },

  getAgentInitStatus(state: State): boolean {
    return state.agentInit;
  },

  getApplicationStartTime(state: State): Date {
    return state.applicationStartTime;
  },

  getLanguageUI: (state: State) => (language: string) => {
    return state.expressionUI[language];
  },
};
