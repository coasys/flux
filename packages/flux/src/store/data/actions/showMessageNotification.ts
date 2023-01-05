import { useUserStore } from "@/store/user";
import { Router } from "vue-router";
import { useDataStore } from "..";
import getProfile from "utils/api/getProfile";
import { differenceInSeconds, parseISO } from "date-fns";
import { useAppStore } from "@/store/app";
import iconPath from "@/assets/images/icon.png";

type Payload = {
  router: Router;
  communityId: string;
  channelId: string;
  authorDid: string;
  message: string;
  timestamp: string;
};

export default async ({
  communityId,
  channelId,
  authorDid,
  message,
  timestamp,
  router,
}: Payload) => {
  const dataStore = useDataStore();
  const userStore = useUserStore();
  const appStore = useAppStore();

  const escapedMessage = message.replace(/(\s*<.*?>\s*)+/g, " ");

  // Getting the channel & community this message belongs to
  const community = dataStore.getCommunity(communityId);
  const communityState = dataStore.getLocalCommunityState(communityId);
  const channel = dataStore.getChannel(channelId);

  const user = userStore.getUser;

  const isFromSelf = user!.agent.did === authorDid;
  const isMinimized = document.hasFocus();
  const isMuted =
    channel?.notifications.mute &&
    communityState.notifications.mute &&
    !appStore.notification.globalNotification;

  if (isFromSelf || isMinimized || isMuted) {
    return;
  }

  const isMentioned = message.includes(
    user!.agent.did!.replace("did:key:", "")
  );

  let title = "";
  let body = "";

  try {
    const profile = await getProfile(authorDid);
    const name = profile ? profile.username : "Someone";
    if (isMentioned) {
      title = `${name} mentioned you`;
      body = `#${channel?.name}: ${escapedMessage}`;
    } else {
      title = `@${name} (${community?.name})`;
      body = `#${channel?.name}: ${escapedMessage}`;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const notification = new Notification(title, {
        body,
        tag: authorDid,
        icon: iconPath,
        renotify: true,
      });

      notification.onclick = () => {
        window.focus();

        router.push({
          name: "channel",
          params: {
            communityId: community!.uuid,
            channelId: channel!.name,
          },
        });

        notification.close();
      };

      return notification;
    }
  } catch (e) {
    console.log(e);
  }
};
