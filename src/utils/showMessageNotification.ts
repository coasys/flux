import { ExpressionTypes } from "@/store/types";
import { RouteLocationNormalizedLoaded, Router } from "vue-router";
import { getProfile } from "./profileHelpers";
import store from "@/store";

export default async (
  router: Router,
  route: RouteLocationNormalizedLoaded,
  perspectiveUuid: string,
  authorDid: string,
  message: string
): Promise<void> => {
  const escapedMessage = message.replace(/(\s*<.*?>\s*)+/g, " ");

  // Getting the channel & community this message belongs to
  const channel = store.getters.getChannel(perspectiveUuid);
  const community = store.getters.getCommunity(
    channel.neighbourhood.membraneRoot!
  );

  const isMinimized = ["minimize", "foreground"].includes(
    store.state.app.windowState
  );

  const { channelId, communityId } = route.params;

  // Only show the notification when the the message is not from self & the active community & channel is different
  if (
    (isMinimized && !channel?.state.notifications.mute) ||
    (store.state.user.agent.did! !== authorDid &&
      (community?.neighbourhood.perspective.uuid === communityId
        ? channel?.neighbourhood.perspective.uuid !== channelId
        : true) &&
      !channel?.state.notifications.mute)
  ) {
    const isMentioned = message.includes(
      store.state.user.agent.did!.replace("did:key:", "")
    );

    let title = "";
    let body = "";

    if (isMentioned) {
      const profileLanguage =
        community?.neighbourhood.typedExpressionLanguages.find(
          (t) => t.expressionType === ExpressionTypes.ProfileExpression
        );
      const profile = await getProfile(
        profileLanguage!.languageAddress,
        authorDid
      );
      //@ts-ignore
      const name = (profile!.data as any).profile["foaf:AccountName"];

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
  }
};
