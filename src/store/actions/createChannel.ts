import { v4 as uuidv4 } from "uuid";
import { Commit } from "vuex";
import { createChannel } from "@/core/methods/createChannel";

import { ChannelState, MembraneType } from "@/store";

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
    const community = getters.getCommunity(communityId);
    const uid = uuidv4().toString();
    const channel = await createChannel(
      name,
      "",
      uid,
      community.perspective,
      community.linkLanguageAddress,
      community.expressionLanguages,
      MembraneType.Inherited,
      community.typedExpressionLanguages
    );

    commit("addChannel", {
      communityId: community.perspective,
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
