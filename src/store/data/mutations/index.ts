import {
  ExpressionAndRef,
  LinkExpressionAndLang,
  CommunityState,
  AddChannel,
  ThemeState,
  ProfileExpression,
  ChannelState,
  LocalCommunityState,
} from "@/store/types";

import { parseExprUrl } from "@perspect3vism/ad4m";
import type { Expression, LinkExpression } from "@perspect3vism/ad4m";
import hash from "object-hash";
import { useDataStore } from "..";

interface UpdatePayload {
  communityId: string;
  name: string;
  description: string;
  image: string;
  thumbnail: string;
  groupExpressionRef: string;
}

interface AddChannelMessages {
  channelId: string;
  communityId: string;
  links: { [x: string]: LinkExpressionAndLang };
  expressions: { [x: string]: ExpressionAndRef };
}

interface AddChannelMessage {
  channelId: string;
  link: LinkExpression;
  expression: Expression;
}

export default {
  addCommunity(payload: CommunityState): void {
    const state = useDataStore();
    state.neighbourhoods[payload.neighbourhood.perspective.uuid] =
      payload.neighbourhood;
    state.communities[payload.neighbourhood.perspective.uuid] = payload.state;
  },

  addCommunityState(payload: LocalCommunityState): void {
    const state = useDataStore();
    state.communities[payload.perspectiveUuid] = payload;
  },

  addMessages(payload: AddChannelMessages): void {
    const state = useDataStore();
    const neighbourhood = state.neighbourhoods[payload.channelId];
    console.log(
      "Adding ",
      Object.values(payload.links).length,
      " to channel and ",
      Object.values(payload.expressions).length,
      " to channel"
    );
    neighbourhood.currentExpressionLinks = {
      ...neighbourhood.currentExpressionLinks,
      ...payload.links,
    };
    neighbourhood.currentExpressionMessages = {
      ...neighbourhood.currentExpressionMessages,
      ...payload.expressions,
    };
  },

  addMessage(payload: AddChannelMessage): void {
    const state = useDataStore();
    const neighbourhood = state.neighbourhoods[payload.channelId];

    neighbourhood.currentExpressionLinks[
      hash(payload.link.data!, { excludeKeys: (key) => key === "__typename" })
    ] = payload.link;
    neighbourhood.currentExpressionMessages[payload.link.data.target] = {
      expression: {
        author: payload.expression.author!,
        data: JSON.parse(payload.expression.data!),
        timestamp: payload.expression.timestamp!,
        proof: payload.expression.proof!,
      } as Expression,
      url: parseExprUrl(payload.link.data!.target!),
    };
  },

  setCurrentChannelId(payload: {
    communityId: string;
    channelId: string;
  }): void {
    const state = useDataStore();
    const { communityId, channelId } = payload;
    state.communities[communityId].currentChannelId = channelId;
  },

  removeCommunity(id: string): void {
    const state = useDataStore();
    delete state.communities[id];
    delete state.neighbourhoods[id];
  },

  setChannelNotificationState({ channelId }: { channelId: string }): void {
    const state = useDataStore();
    const channel = state.channels[channelId];

    channel.notifications.mute = !channel.notifications.mute;
  },

  setCommunityMembers({
    members,
    communityId,
  }: {
    members: ProfileExpression[];
    communityId: string;
  }): void {
    const state = useDataStore();
    const community = state.neighbourhoods[communityId];

    if (community) {
      community.members = members;
    }
  },

  setCommunityTheme(payload: { communityId: string; theme: ThemeState }): void {
    const state = useDataStore();
    state.communities[payload.communityId].theme = {
      ...state.communities[payload.communityId].theme,
      ...payload.theme,
    };
  },

  updateCommunityMetadata({
    communityId,
    name,
    description,
    image,
    thumbnail,
    groupExpressionRef,
  }: UpdatePayload): void {
    const state = useDataStore();
    const community = state.neighbourhoods[communityId];

    if (community) {
      community.name = name;
      community.description = description;
      community.image = image;
      community.thumbnail = thumbnail;
      community.groupExpressionRef = groupExpressionRef;
    }

    state.neighbourhoods[communityId] = community;
  },

  setChannelScrollTop(payload: { channelId: string; value: number }): void {
    const state = useDataStore();
    state.channels[payload.channelId].scrollTop = payload.value;
  },

  addChannel(payload: AddChannel): void {
    const state = useDataStore();
    const parentNeighbourhood = state.neighbourhoods[payload.communityId];

    if (parentNeighbourhood !== undefined) {
      if (
        parentNeighbourhood.linkedNeighbourhoods.indexOf(
          payload.channel.neighbourhood.neighbourhoodUrl
        ) === -1
      ) {
        parentNeighbourhood.linkedNeighbourhoods.push(
          payload.channel.neighbourhood.neighbourhoodUrl
        );
      }

      if (
        parentNeighbourhood.linkedPerspectives.indexOf(
          payload.channel.neighbourhood.perspective.uuid
        ) === -1
      ) {
        parentNeighbourhood.linkedPerspectives.push(
          payload.channel.neighbourhood.perspective.uuid
        );
      }

      state.channels[payload.channel.neighbourhood.perspective.uuid] =
        payload.channel.state;

      state.neighbourhoods[payload.channel.neighbourhood.perspective.uuid] =
        payload.channel.neighbourhood;
    }
  },

  createChannelMutation(payload: ChannelState): void {
    const state = useDataStore();
    state.channels[payload.neighbourhood.perspective.uuid] = payload.state;
    state.neighbourhoods[payload.neighbourhood.perspective.uuid] =
      payload.neighbourhood;
  },

  setuseLocalTheme(payload: { communityId: string; value: boolean }): void {
    const state = useDataStore();
    const community = state.communities[payload.communityId];
    community.useLocalTheme = payload.value;
  },

  setHasNewMessages(payload: { channelId: string; value: boolean }): void {
    const state = useDataStore();
    const channel = state.channels[payload.channelId];
    channel.hasNewMessages = payload.value;
  },

  addExpressionAndLink: (payload: {
    channelId: string;
    link: LinkExpression;
    message: Expression;
  }): void => {
    const state = useDataStore();
    const channel = state.neighbourhoods[payload.channelId];
    console.log("Adding to link and exp to channel!", payload.message);
    channel.currentExpressionLinks[
      hash(payload.link.data!, { excludeKeys: (key) => key === "__typename" })
    ] = {
      expression: payload.link,
      language: "na",
    } as LinkExpressionAndLang;
    //TODO: make gql expression to ad4m expression conversion function
    channel.currentExpressionMessages[payload.link.data.target] = {
      expression: {
        author: payload.message.author!,
        data: JSON.parse(payload.message.data!),
        timestamp: payload.message.timestamp!,
        proof: payload.message.proof!,
      } as Expression,
      url: parseExprUrl(payload.link.data!.target!),
    } as ExpressionAndRef;
  },
};
