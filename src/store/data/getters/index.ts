import {
  DataState,
  CommunityState,
  ChannelState,
  NeighbourhoodState,
  LocalCommunityState,
} from "@/store/types";

export default {
  getNeighbourhood:
    (state: DataState) =>
    (id: string): NeighbourhoodState => {
      return state.neighbourhoods[id];
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

  getCommunityNeighbourhoods(state: DataState): NeighbourhoodState[] {
    return Object.values(state.communities).map(
      (community) => state.neighbourhoods[community.perspectiveUuid]
    );
  },

  getCommunityState:
    (state: DataState) =>
    (id: string): LocalCommunityState => {
      return state.communities[id];
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

  getChannelNeighbourhoods:
    (state: DataState) =>
    (communityId: string): NeighbourhoodState[] => {
      return Object.values(state.communities[communityId].channels).map(
        (channel) => state.neighbourhoods[channel.perspectiveUuid]
      );
    },
};
