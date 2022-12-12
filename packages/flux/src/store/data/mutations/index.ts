import {
  CommunityState,
  ThemeState,
  LocalCommunityState,
  ChannelState,
} from "@/store/types";
import { ChannelView, CommunityMetaData } from "utils/types";
import { useDataStore } from "@/store/data";
import { Channel } from "utils/api/channel";

interface UpdatePayload {
  communityId: string;
  metadata: CommunityMetaData;
}

interface AddChannel {
  communityId: string;
  channel: ChannelState;
}

export default {
  addCommunity(payload: CommunityState): void {
    const state = useDataStore();
    state.neighbourhoods[payload.neighbourhood.uuid] = payload.neighbourhood;
    state.communities[payload.neighbourhood.uuid] = payload.state;
  },

  addCommunityState(payload: LocalCommunityState): void {
    const state = useDataStore();
    state.communities[payload.perspectiveUuid] = payload;
  },

  setCurrentChannelId(payload: {
    communityId: string;
    channelId: string;
  }): void {
    const state = useDataStore();
    const { communityId, channelId } = payload;
    state.communities[communityId].currentChannelId = channelId;
  },

  setChannelNotificationState({ channelId }: { channelId: string }): void {
    const state = useDataStore();
    const channel = state.channels[channelId];

    channel.notifications.mute = !channel.notifications.mute;
  },

  toggleCommunityMute({ communityId }: { communityId: string }): void {
    const state = useDataStore();
    const community = state.communities[communityId];

    if (community.notifications) {
      community.notifications.mute = !community.notifications.mute;
    } else {
      community.notifications = { mute: true };
    }
  },

  setNeighbourhoodMember({
    did,
    perspectiveUuid,
  }: {
    did: string;
    perspectiveUuid: string;
  }): void {
    const state = useDataStore();
    const neighbourhood = state.neighbourhoods[perspectiveUuid];

    if (
      neighbourhood &&
      !neighbourhood.members.find((existingMember) => existingMember === did)
    ) {
      neighbourhood.members.push(did);
    }
  },

  setNeighbourhoodMembers({
    members,
    perspectiveUuid,
  }: {
    members: string[];
    perspectiveUuid: string;
  }): void {
    const state = useDataStore();
    const neighbourhood = state.neighbourhoods[perspectiveUuid];

    neighbourhood.members = members;
  },

  setCommunityTheme(payload: { communityId: string; theme: ThemeState }): void {
    const state = useDataStore();
    state.communities[payload.communityId].theme = {
      ...state.communities[payload.communityId].theme,
      ...payload.theme,
    };
  },

  updateCommunityMetadata({ communityId, metadata }: UpdatePayload): void {
    const state = useDataStore();
    const community = state.neighbourhoods[communityId];

    if (community) {
      if (metadata?.name) {
        community.name = metadata.name;
      }
      if (metadata?.description) {
        community.description = metadata.description;
      }
      if (metadata?.image) {
        community.image = metadata.image;
      }
      if (metadata?.thumbnail) {
        community.thumbnail = metadata.thumbnail;
      }
    }

    state.neighbourhoods[communityId] = community;
  },

  setChannelScrollTop(payload: { channelId: string; value: number }): void {
    const state = useDataStore();
    state.channels[payload.channelId].scrollTop = payload.value;
  },

  clearChannels({ communityId }: { communityId: string }): void {
    const state = useDataStore();
    Object.values(state.channels).forEach((c) => {
      if (c.sourcePerspective === communityId) {
        delete state.channels[c.id];
      }
    });
  },

  putChannelView(payload: { channelId: string; view: ChannelView }) {
    const state = useDataStore();
    const channel = state.channels[payload.channelId];
    if (channel) {
      const alreadyHasView = channel.views?.includes(payload.view);
      if (!alreadyHasView) {
        channel.views =
          channel.views?.length > 0
            ? [...channel.views, payload.view]
            : [payload.view];
      }
    }
  },

  setChannel(payload: { communityId: string; channel: ChannelState }) {
    const state = useDataStore();
    state.channels[payload.channel.id] = payload.channel;
  },

  setChannels(payload: { communityId: string; channels: ChannelState[] }) {
    const state = useDataStore();
    payload.channels.forEach((channel) => {
      state.channels[channel.id] = channel;
    });
  },

  toggleChannelCollapse(channelId: string) {
    const state = useDataStore();
    state.channels[channelId].collapsed = !state.channels[channelId].collapsed;
  },

  setCurrentChannelView(payload: { channelId: string; view: ChannelView }) {
    const state = useDataStore();
    state.channels[payload.channelId].currentView = payload.view;
  },

  addChannel(payload: AddChannel): void {
    const state = useDataStore();
    const parentNeighbourhood = state.neighbourhoods[payload.communityId];

    if (parentNeighbourhood) {
      const exists = Object.values(state.channels).find(
        (c: ChannelState) =>
          c.name === payload.channel.name &&
          c.sourcePerspective === payload.communityId
      );

      if (!exists) {
        state.channels[payload.channel.id] = payload.channel;
      }
    }
  },

  removeChannel(payload: { channelId: string }): void {
    const state = useDataStore();
    delete state.channels[payload.channelId];
  },

  addLocalChannel(payload: {
    perspectiveUuid: string;
    channel: ChannelState;
  }): void {
    const state = useDataStore();
    state.channels[payload.perspectiveUuid] = payload.channel;
  },

  toggleHideMutedChannels(payload: { communityId: string }): void {
    const state = useDataStore();
    const community = state.communities[payload.communityId];
    community.hideMutedChannels = !community.hideMutedChannels;
  },

  createChannelMutation(payload: ChannelState): void {
    const state = useDataStore();
    state.channels[payload.id] = payload;
  },

  setuseLocalTheme(payload: { communityId: string; value: boolean }): void {
    const state = useDataStore();
    const community = state.communities[payload.communityId];
    community.useLocalTheme = payload.value;
  },

  setHasNewMessages(payload: {
    communityId: string;
    channelId: string;
    value: boolean;
  }): void {
    const state = useDataStore();
    const channel = state.getChannel(payload.channelId);
    const tempCommunity = state.getCommunity(payload.communityId);
    const community = state.communities[tempCommunity.uuid];
    channel!.hasNewMessages = payload.value;
    community.hasNewMessages = state
      .getChannelStates(tempCommunity.uuid)
      .reduce((acc: boolean, channel) => {
        if (!acc) return channel.hasNewMessages;
        return true;
      }, false);
  },
};
