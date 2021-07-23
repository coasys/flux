import {
  DataState,
  CommunityState,
  ChannelState,
  NeighbourhoodState,
} from "@/store/types";

export default {
  // Get the list of communities a user is a part of

  getCommunityNeighbourhoods(state: DataState): NeighbourhoodState[] {
    return Object.values(state.communities).map(
      (community) => state.neighbourhoods[community.perspectiveUuid]
    );
  },

  getCommunities(state: DataState): CommunityState[] {
    const out = [];
    for (const community of Object.values(state.communities)) {
      out.push({
        neighbourhood: state.neighbourhoods[community.perspectiveUuid],
        state: community,
      } as CommunityState);
    }
    return out;
  },

  getCommunity:
    (state: DataState) =>
    (id: string): CommunityState => {
      const neighbourhood = state.neighbourhoods[id];
      const community = state.communities[id];

      return {
        neighbourhood,
        state: community,
      } as CommunityState;
    },

  getChannelsByCommunity:
    (state: DataState) =>
    (id: string): ChannelState[] => {
      const neighbourhood = state.neighbourhoods[id];
      const out = [];
      for (const channelPerspectiveUuid of neighbourhood.linkedNeighbourhoods) {
        out.push({
          neighbourhood: state.neighbourhoods[channelPerspectiveUuid],
          state: Datastate.communities[id].channels[channelPerspectiveUuid],
        } as ChannelState);
      }

      return out;
    },

  getChannel:
    (state: DataState) =>
    (payload: { channelId: string; communityId: string }): ChannelState => {
      const { channelId, communityId } = payload;
      const neighbourhood = state.neighbourhoods[channelId];
      const channel = state.communities[communityId].channels[channelId];

      return {
        neighbourhood,
        state: channel,
      } as ChannelState;
    },
};
