export default {
  // Get the list of communities a user is a part of
  getCommunities(state: State): { [x: string]: CommunityState } {
    return state.communities;
  },

  getCommunity:
    (state: State) =>
    (id: string): CommunityState => {
      const neighbourhood = state.neighbourhoods[id];
      const community = state.communities[id];

      return {
        neighbourhood,
        state: community,
      } as CommunityState;
    },

  getChannelsByCommunity:
    (state: State) =>
    (id: string): ChannelState[] => {
      const neighbourhood = state.neighbourhoods[id];
      const out = [];
      for (const channelPerspectiveUuid of neighbourhood.linkedNeighbourhoods) {
        out.push({
          neighbourhood: state.neighbourhoods[channelPerspectiveUuid],
          state: state.communities[id].channels[channelPerspectiveUuid],
        } as ChannelState);
      }

      return out;
    },

  getChannel:
    (state: State) =>
    (payload: { channelId: string; communityId: string }): ChannelState => {
      const { channelId, communityId } = payload;
      const neighbourhood = state.neighbourhoods[channelId];
      const channel = state.communities[communityId].channels[channelId];

      return {
        neighbourhood,
        state: channel,
      } as ChannelState;
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
};
