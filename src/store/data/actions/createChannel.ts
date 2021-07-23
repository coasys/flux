import { createChannel } from "@/core/methods/createChannel";

import { ChannelState, MembraneType } from "@/store/types";
import { rootGetterContext, rootActionContext } from "@/store/index";

export interface Payload {
  communityId: string;
  name: string;
}

export default async (
  context: any,
  payload: Payload
): Promise<ChannelState> => {
  const { getters } = rootGetterContext(context);
  const { commit } = rootActionContext(context);
  try {
    const community = getters.getCommunity(payload.communityId);
    const channel = await createChannel(
      payload.name,
      getters.getLanguagePath,
      community.neighbourhood.perspective,
      MembraneType.Inherited,
      community.neighbourhood.typedExpressionLanguages
    );

    commit.addChannel({
      communityId: community.neighbourhood.perspective.uuid,
      channel,
    });

    return channel;
  } catch (e) {
    commit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
