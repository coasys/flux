import { useUserStore } from "@/store/user";
import { RouteLocationNormalizedLoaded, Router } from "vue-router";
import { useDataStore } from "..";
import getProfile from "utils/api/getProfile";
import { differenceInSeconds, parseISO } from "date-fns";
import { useAppStore } from "@/store/app";
import { Literal } from "@perspect3vism/ad4m";

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
  // TODO: @fayeed change this.
  const channel = dataStore.getChannel(perspectiveUuid, channelLiteral.data);

  const isMinimized = document.hasFocus();

  const user = userStore.getUser;

  // Only show the notification when the the message is not from self & the active community & channel is different
  if (
    (!isMinimized &&
      !channel?.notifications.mute &&
      !community?.state.notifications.mute && user!.agent.did! !== authorDid) ||
    (user!.agent.did! !== authorDid &&
      (community?.neighbourhood.perspective.uuid === communityId
        ? channel?.name !== channelId
        : true) &&
      !channel?.notifications.mute &&
      !community?.state.notifications.mute &&
      differenceInSeconds(new Date(), parseISO(timestamp)) <= 30 &&
      appStore.notification.globalNotification)
  ) {
    const isMentioned = message.includes(
      user!.agent.did!.replace("did:key:", "")
    );

    let title = "";
    let body = "";

    const profile = await getProfile(authorDid);
    const name = profile ? profile.username : "Someone";
    if (isMentioned) {
      title = `${name} mentioned you in #${channel?.name}}`;
      body = escapedMessage;
    } else {
      title = `New message in ${community?.neighbourhood.name} from @${name}`;
      body = `#${channel?.name}: ${escapedMessage}`;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/assets/images/icon.png",
      });

      notification.onclick = () => {
        window.focus();

        router.push({
          name: "channel",
          params: {
            communityId: community!.neighbourhood.perspective!.uuid,
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
