import { Commit } from "vuex";
import { createChannel } from "@/core/methods/createChannel";

import { ChannelState, MembraneType, CommunityState } from "@/store/types";

export interface Context {
  commit: Commit;
  getters: any;
}

export interface Payload {
  communityId: string;
  name: string;
}

export default async (
  { commit, getters }: Context,
  { communityId, name }: Payload
): Promise<ChannelState> => {
  try {
    const community: CommunityState = getters.getCommunity(communityId);
    const channel = await createChannel(
      name,
      getters.getLanguagePath,
      community.perspective,
      MembraneType.Inherited,
      community.typedExpressionLanguages
    );

    commit("addChannel", {
      communityId: community.perspective.uuid,
      channel,
    });

    return channel;
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
