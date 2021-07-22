import { State, CommunityState, ChannelState } from "@/store/types";

export default {
  // Get the list of communities a user is a part of
  getCommunities(state: State): CommunityState[] {
    const out = [];
    for (const neighbourhood of Object.values(state.data.neighbourhoods)) {
      out.push({
        neighbourhood,
        state: state.data.communities[neighbourhood.perspective.uuid],
      } as CommunityState);
    }
    return out;
  },

  getCommunity:
    (state: State) =>
    (id: string): CommunityState => {
      const neighbourhood = state.data.neighbourhoods[id];
      const community = state.data.communities[id];

      return {
        neighbourhood,
        state: community,
      } as CommunityState;
    },

  getChannelsByCommunity:
    (state: State) =>
    (id: string): ChannelState[] => {
      const neighbourhood = state.data.neighbourhoods[id];
      const out = [];
      for (const channelPerspectiveUuid of neighbourhood.linkedNeighbourhoods) {
        out.push({
          neighbourhood: state.data.neighbourhoods[channelPerspectiveUuid],
          state: state.data.communities[id].channels[channelPerspectiveUuid],
        } as ChannelState);
      }

      return out;
    },

  getChannel:
    (state: State) =>
    (payload: { channelId: string; communityId: string }): ChannelState => {
      const { channelId, communityId } = payload;
      const neighbourhood = state.data.neighbourhoods[channelId];
      const channel = state.data.communities[communityId].channels[channelId];

      return {
        neighbourhood,
        state: channel,
      } as ChannelState;
    },
};
