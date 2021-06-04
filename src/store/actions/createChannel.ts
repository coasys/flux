import { v4 as uuidv4 } from "uuid";
import { Commit } from "vuex";
import { createChannel } from "@/core/methods/createChannel";

import { MembraneType } from "@/store";

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
  } catch (e) {
    commit("setToast", {
      variant: "danger",
      open: true,
      message:
        "Ops! Could not create channel. Try again, and let us know if it happends again.",
    });
    throw new Error(e);
  }
};
