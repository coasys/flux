import { createChannel } from "@/core/methods/createChannel";
import { ChannelState, MembraneType } from "@/store/types";
import { dataActionContext } from "@/store/data/index";
import { userActionContext } from "@/store/user/index";
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
  const { getters: userGetters } = userActionContext(context);
  try {
    const community = dataGetters.getCommunity(payload.communityId);

    if (community.neighbourhood !== undefined) {
      const channel = await createChannel({
        channelName: payload.name,
        languagePath: appGetters.getLanguagePath,
        creatorDid: userGetters.getUser!.agent.did || "",
        sourcePerspective: community.neighbourhood.perspective,
        membraneType: MembraneType.Inherited,
        typedExpressionLanguages:
          community.neighbourhood.typedExpressionLanguages,
      });

      dataCommit.addChannel({
        communityId: community.neighbourhood.perspective.uuid,
        channel,
      });

      return channel;
    } else {
      const message = "Community does not exists";
      appCommit.showDangerToast({
        message,
      });
      throw Error(message);
    }
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
