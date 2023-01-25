import {
  DataState,
  CommunityState,
  ChannelState,
  LocalCommunityState,
} from "@/store/types";
import { Community } from "utils/types";

export default {
  getCommunity:
    (state: DataState) =>
    (id: string): Community => {
      return state.neighbourhoods[id];
    },

  getCommunityState:
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

  getCommunityByNeighbourhoodUrl:
    (state: DataState) =>
    (url: string): CommunityState | undefined => {
      for (const neighbourhood of Object.values(state.neighbourhoods)) {
        if (neighbourhood.neighbourhoodUrl === url) {
          return {
            neighbourhood: state.neighbourhoods[neighbourhood.uuid],
            state: state.communities[neighbourhood.uuid],
          } as CommunityState;
        }
      }
    },

  getChannels(state: DataState): ChannelState[] {
    const out = [];
    for (const channel of Object.values(state.channels)) {
      out.push(channel);
    }
    return out;
  },

  getCommunityNeighbourhoods(state: DataState): Community[] {
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
      const channel = state.channels[neighbourhood?.uuid];
      return channel;
    },

  getLocalCommunityState:
    (state: DataState) =>
    (id: string): LocalCommunityState => {
      return state.communities[id];
    },

  getChannel:
    (state: DataState) =>
    (channelId: string): ChannelState | undefined => {
      const channel = Object.values(state.channels).find(
        (c) => c.id === channelId
      );

      return channel;
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
