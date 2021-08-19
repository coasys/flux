import { useAppStore } from "@/store/app";
import { ExpressionTypes } from "@/store/types";
import { useUserStore } from "@/store/user";
import { RouteLocationNormalizedLoaded, Router } from "vue-router";
import { useDataStore } from "..";
import { getProfile } from "@/utils/profileHelpers";

type Payload = {
  router: Router;
  route: RouteLocationNormalizedLoaded;
  perspectiveUuid: string;
  authorDid: string;
  message: string;
};

export default async (
  { router, route, perspectiveUuid, authorDid, message }: Payload
): Promise<Notification | undefined> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();

  const escapedMessage = message.replace(/(\s*<.*?>\s*)+/g, " ");

  // Getting the channel & community this message belongs to
  const channel = dataStore.getChannel(perspectiveUuid);
  const community = dataStore.getCommunity(
    channel.neighbourhood.membraneRoot!
  );

  const isMinimized = ["minimize", "foreground"].includes(
    appStore.getWindowState
  );

  const { channelId, communityId } = route.params;

  const user = userStore.getUser;

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

    return notification;
  }

  return undefined;
};
