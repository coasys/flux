import {
  DataState,
  CommunityState,
  ChannelState,
  NeighbourhoodState,
  LocalCommunityState,
} from "@/store/types";
import { Expression } from "@perspect3vism/ad4m";

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
      return {
        neighbourhood,
        state: channel,
      };
    },

  getNeighbourhoodByUrl:
    (state: DataState) =>
    (url: string): NeighbourhoodState | null => {
      const neighbourhood = Object.values(state.neighbourhoods)
        .filter((community) => community.perspective.sharedUrl === url)
        .pop();
      if (neighbourhood == undefined) {
        return null;
      } else {
        return neighbourhood;
      }
    },

  getCommunityState:
    (state: DataState) =>
    (id: string): LocalCommunityState => {
      return state.communities[id];
    },

  getChannel:
    (state: DataState) =>
    (channelId: string): ChannelState => {
      const neighbourhood = state.neighbourhoods[channelId];
      const channel = state.channels[channelId];

      return {
        neighbourhood,
        state: channel,
      } as ChannelState;
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
      const links = state.neighbourhoods[communityId].linkedPerspectives;
      return links
        .filter((link, index) => links.indexOf(link) === index)
        .map((perspectiveUuid) => {
          return {
            neighbourhood: state.neighbourhoods[perspectiveUuid],
            state: state.channels[perspectiveUuid],
          } as ChannelState;
        });
    },

  getCommunityMembers:
    (state: DataState) =>
    (communityId: string): { [x: string]: Expression } => {
      if (!state.communities[communityId]) {
        return {};
      }
      return state.neighbourhoods[communityId].members;
    },
};
