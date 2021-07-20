import { Commit } from "vuex";
import { createChannel } from "@/core/methods/createChannel";

import { CommunityState, MembraneType } from "@/store";

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
): Promise<void> => {
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
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
