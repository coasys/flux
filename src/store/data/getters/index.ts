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

  getChannels(state: DataState): ChannelState[] {
    const out = [];
    for (const channel of Object.values(state.channels)) {
      out.push(channel);
    }
    return out;
  },

  getCommunityNeighbourhoods(state: DataState): NeighbourhoodState[] {
    return Object.values(state.communities).map(
      (community) => state.neighbourhoods[community.perspectiveUuid]
    );
  },

  getChannelByNeighbourhoodUrl:
    (state: DataState) =>
    (url: string): ChannelState | null => {
      const neighbourhood = Object.values(state.neighbourhoods)
        .filter((neighourhood) => neighourhood.neighbourhoodUrl == url)
        .pop();
      if (neighbourhood == undefined) {
        return null;
      }
      const channel = state.channels[neighbourhood?.perspective.uuid];
      return channel;
    },

  getCommunityState:
    (state: DataState) =>
    (id: string): LocalCommunityState => {
      return state.communities[id];
    },

  getChannel:
    (state: DataState) =>
    (communityId: string, channelId: string): ChannelState | undefined => {
      const channel = Object.values(state.channels).find(
        (c) => c.sourcePerspective === communityId && c.id === channelId
      );

      return channel;
    },

  getChannelNeighbourhoods:
    (state: DataState) =>
    (communityId: string): NeighbourhoodState[] => {
      return Object.values(
        state.neighbourhoods[communityId].linkedPerspectives
      ).map((perspectiveUuid) => state.neighbourhoods[perspectiveUuid]);
    },

  getChannelStates:
    (state: DataState) =>
    (communityId: string): ChannelState[] => {
      return Object.values(state.channels).filter(
        (c: ChannelState) => c.sourcePerspective === communityId
      );
    },

  getCommunityMembers:
    (state: DataState) =>
    (communityId: string): string[] => {
      if (!state.communities[communityId]) {
        return [];
      }
      return state.neighbourhoods[communityId].members;
    },
};
