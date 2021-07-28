import { createChannel } from "@/core/methods/createChannel";
import { ChannelState, MembraneType } from "@/store/types";
import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";

export interface Payload {
  communityId: string;
  name: string;
}

export default async (
  context: any,
  payload: Payload
): Promise<ChannelState> => {
  const { commit: dataCommit, getters: dataGetters } =
    dataActionContext(context);
  const { commit: appCommit, getters: appGetters } = appActionContext(context);
  try {
    const community = dataGetters.getCommunity(payload.communityId);
    const channel = await createChannel(
      payload.name,
      appGetters.getLanguagePath,
      community.neighbourhood.perspective,
      MembraneType.Inherited,
      community.neighbourhood.typedExpressionLanguages
    );

    dataCommit.addChannel({
      communityId: community.neighbourhood.perspective.uuid,
      channel,
    });

    return channel;
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
