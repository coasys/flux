import { useUserStore } from "@/store/user";
import { RouteLocationNormalizedLoaded, Router } from "vue-router";
import { useDataStore } from "..";
import getProfile from "utils/api/getProfile";
import { differenceInSeconds, parseISO, parse } from "date-fns";
import { useAppStore } from "@/store/app";
import { Literal } from "@perspect3vism/ad4m";
import iconPath from "@/assets/images/icon.png";

type Payload = {
  router: Router;
  route: RouteLocationNormalizedLoaded;
  perspectiveUuid: string;
  notificationChannelId: string;
  authorDid: string;
  message: string;
  timestamp: string;
};

export default async ({
  router,
  route,
  perspectiveUuid,
  notificationChannelId,
  authorDid,
  message,
  timestamp,
}: Payload) => {
  const dataStore = useDataStore();
  const userStore = useUserStore();
  const appStore = useAppStore();
  const { channelId, communityId } = route.params;

  const escapedMessage = message.replace(/(\s*<.*?>\s*)+/g, " ");

  const channelLiteral = Literal.fromUrl(notificationChannelId).get();

  // Getting the channel & community this message belongs to
  const community = dataStore.getCommunity(perspectiveUuid);
  const channel = dataStore.getChannel(perspectiveUuid, channelLiteral.data);

  const isMinimized = document.hasFocus();

  const user = userStore.getUser;

  const currentDate = new Date();

  const lastDate = parseISO(
    localStorage.getItem("lastNotificationDate") || currentDate.toISOString()
  );

  localStorage.setItem("lastNotificationDate", currentDate.toISOString());

  const slient = differenceInSeconds(currentDate, lastDate) <= 3;

  // Only show the notification when the the message is not from self & the active community & channel is different
  if (
    (!isMinimized &&
      !channel?.notifications.mute &&
      !community?.state.notifications.mute &&
      !slient &&
      user!.agent.did! !== authorDid) ||
    (user!.agent.did! !== authorDid &&
      (community?.neighbourhood.uuid === communityId
        ? channel?.name !== channelId
        : true) &&
      !channel?.notifications.mute &&
      !community?.state.notifications.mute &&
      differenceInSeconds(new Date(), parseISO(timestamp)) <= 30 &&
      appStore.notification.globalNotification &&
      !slient)
  ) {
    const isMentioned = message.includes(
      user!.agent.did!.replace("did:key:", "")
    );

    let title = "";
    let body = "";

    const profile = await getProfile(authorDid);
    const name = profile ? profile.username : "Someone";
    if (isMentioned) {
      title = `${name} mentioned you`;
      body = `#${channel?.name}: ${escapedMessage}`;
    } else {
      title = `@${name} (${community?.neighbourhood.name})`;
      body = `#${channel?.name}: ${escapedMessage}`;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const notification = new Notification(title, {
        body,
        tag: `flux_${authorDid}`,
        silent: false,
        renotify: true,
        icon: iconPath,
      });

      notification.onclick = () => {
        window.focus();

        router.push({
          name: "channel",
          params: {
            communityId: community!.neighbourhood.uuid,
            channelId: channel!.name,
          },
        });

        notification.close();
      };

      return notification;
    }
  }

  return undefined;
};
