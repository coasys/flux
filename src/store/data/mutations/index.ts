import {
  ExpressionAndRef,
  LinkExpressionAndLang,
  State,
  DataState,
  CommunityState,
  AddChannel,
  ThemeState,
  ProfileExpression,
  ChannelState,
} from "@/store/types";

import { parseExprUrl } from "@perspect3vism/ad4m-types";
import type { Expression, LinkExpression } from "@perspect3vism/ad4m-types";
import hash from "object-hash";

interface UpdatePayload {
  communityId: string;
  name: string;
  description: string;
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
  addCommunity(state: DataState, payload: CommunityState): void {
    state.neighbourhoods[payload.neighbourhood.perspective.uuid] =
      payload.neighbourhood;
    state.communities[payload.neighbourhood.perspective.uuid] = payload.state;
  },

  addMessages(state: DataState, payload: AddChannelMessages): void {
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

  addMessage(state: DataState, payload: AddChannelMessage): void {
    const neighbourhood = state.neighbourhoods[payload.channelId];

    neighbourhood.currentExpressionLinks[
      hash(payload.link.data!, { excludeValues: "__typename" })
    ] = payload.link;
    neighbourhood.currentExpressionMessages[payload.expression.url!] = {
      expression: {
        author: payload.expression.author!,
        data: JSON.parse(payload.expression.data!),
        timestamp: payload.expression.timestamp!,
        proof: payload.expression.proof!,
      } as Expression,
      url: parseExprUrl(payload.link.data!.target!),
    };
  },

  setCurrentChannelId(
    state: DataState,
    payload: { communityId: string; channelId: string }
  ): void {
    const { communityId, channelId } = payload;
    state.communities[communityId].currentChannelId = channelId;
  },

  removeCommunity(state: DataState, id: string): void {
    delete state.communities[id];
    delete state.neighbourhoods[id];
  },

  setChannelNotificationState(
    state: DataState,
    { channelId }: { channelId: string }
  ): void {
    const channel = state.channels[channelId];

    channel.notifications.mute = !channel.notifications.mute;
  },

  setCommunityMembers(
    state: DataState,
    {
      members,
      communityId,
    }: { members: ProfileExpression[]; communityId: string }
  ): void {
    const community = state.neighbourhoods[communityId];

    if (community) {
      community.members = members;
    }
  },

  setCommunityTheme(
    state: DataState,
    payload: { communityId: string; theme: ThemeState }
  ): void {
    state.communities[payload.communityId].theme = {
      ...state.communities[payload.communityId].theme,
      ...payload.theme,
    };
  },

  updateCommunityMetadata(
    state: DataState,
    { communityId, name, description, groupExpressionRef }: UpdatePayload
  ): void {
    const community = state.neighbourhoods[communityId];

    if (community) {
      community.name = name;
      community.description = description;
      community.groupExpressionRef = groupExpressionRef;
    }

    state.neighbourhoods[communityId] = community;
  },

  setChannelScrollTop(
    state: DataState,
    payload: { channelId: string; value: number }
  ): void {
    state.channels[payload.channelId].scrollTop = payload.value;
  },

  addChannel(state: DataState, payload: AddChannel): void {
    const parentNeighbourhood = state.neighbourhoods[payload.communityId];

    if (parentNeighbourhood !== undefined) {
      if (parentNeighbourhood.linkedNeighbourhoods.indexOf(payload.channel.neighbourhood.neighbourhoodUrl) === -1) {        
        parentNeighbourhood.linkedNeighbourhoods.push(
          payload.channel.neighbourhood.neighbourhoodUrl
        );
      }

      if (parentNeighbourhood.linkedPerspectives.indexOf(payload.channel.neighbourhood.perspective.uuid) === -1) {        
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

  createChannel(state: DataState, payload: ChannelState): void {
    state.channels[payload.neighbourhood.perspective.uuid] = payload.state;
    state.neighbourhoods[payload.neighbourhood.perspective.uuid] =
      payload.neighbourhood;
  },

  setHasNewMessages(
    state: DataState,
    payload: { channelId: string; value: boolean }
  ): void {
    const channel = state.channels[payload.channelId];
    channel.hasNewMessages = payload.value;
  },

  addExpressionAndLink: (
    state: DataState,
    payload: {
      channelId: string;
      link: LinkExpression;
      message: Expression;
    }
  ): void => {
    const channel = state.neighbourhoods[payload.channelId];
    console.log("Adding to link and exp to channel!", payload.message);
    channel.currentExpressionLinks[
      hash(payload.link.data!, { excludeValues: "__typename" })
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
