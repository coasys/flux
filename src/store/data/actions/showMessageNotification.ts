import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";
import { userActionContext } from "@/store/user/index";
import { ExpressionTypes } from "@/store/types";
import { RouteLocationNormalizedLoaded, Router } from "vue-router";
import { getProfile } from "../../../utils/profileHelpers";
import { ACCOUNT_NAME } from "@/constants/profile";

type Payload = {
  router: Router;
  route: RouteLocationNormalizedLoaded;
  perspectiveUuid: string;
  authorDid: string;
  message: string;
};

export default async (
  context: any,
  { router, route, perspectiveUuid, authorDid, message }: Payload
): Promise<Notification | undefined> => {
  const { getters: dataGetters } = dataActionContext(context);
  const { getters: appGetters } = appActionContext(context);
  const { getters: userGetters } = userActionContext(context);

  const escapedMessage = message.replace(/(\s*<.*?>\s*)+/g, " ");

  // Getting the channel & community this message belongs to
  const channel = dataGetters.getChannel(perspectiveUuid);
  const community = dataGetters.getCommunity(
    channel.neighbourhood.membraneRoot!
  );

  const isMinimized = ["minimize", "foreground"].includes(
    appGetters.getWindowState
  );

  const { channelId, communityId } = route.params;

  const user = userGetters.getUser;

  // Only show the notification when the the message is not from self & the active community & channel is different
  if (
    (isMinimized && !channel?.state.notifications.mute) ||
    (user!.agent.did! !== authorDid &&
      (community?.neighbourhood.perspective.uuid === communityId
        ? channel?.neighbourhood.perspective.uuid !== channelId
        : true) &&
      !channel?.state.notifications.mute)
  ) {
    const isMentioned = message.includes(
      user!.agent.did!.replace("did:key:", "")
    );

    let title = "";
    let body = "";

    if (isMentioned) {
      const profileLanguage =
        community?.neighbourhood.typedExpressionLanguages.find(
          (t: any) => t.expressionType === ExpressionTypes.ProfileExpression
        );
      const profile = await getProfile(
        profileLanguage!.languageAddress,
        authorDid
      );
      //@ts-ignore
      const name = profile.data.profile[ACCOUNT_NAME];

      title = `${name} mentioned you in #${channel?.neighbourhood.name}}`;
      body = escapedMessage;
    } else {
      title = `New message in ${community?.neighbourhood.name}`;
      body = `#${channel?.neighbourhood.name}: ${escapedMessage}`;
    }

    const notification = new Notification(title, {
      body,
      icon: "/assets/images/junto_app_icon.png",
    });

    // Clicking on notification will take the user to that community & channel
    notification.onclick = () => {
      window.api.send("restoreWindow");

      router.push({
        name: "channel",
        params: {
          communityId: community!.neighbourhood.perspective!.uuid,
          channelId: channel!.neighbourhood.perspective!.uuid,
        },
      });
    };

    return notification;
  }

  return undefined;
};
