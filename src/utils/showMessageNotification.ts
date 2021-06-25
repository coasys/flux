import { ChannelState, CommunityState, State } from "@/store";
import { RouteLocationNormalizedLoaded, Router } from "vue-router";
import { Store } from "vuex";

export default async (
  router: Router,
  route: RouteLocationNormalizedLoaded,
  store: Store<State>,
  languageAddress: string,
  authorDid: string,
  message: string
) => {
  let community: CommunityState | undefined;
  let channel: ChannelState | undefined;

  // Getting the community & channel this message belongs too
  for (const comm of Object.values(store.state.communities)) {
    const temp = comm as CommunityState;
    channel = Object.values(temp.channels).find(
      (c: any) => c.linkLanguageAddress === languageAddress
    ) as ChannelState;

    if (channel) {
      community = temp;

      break;
    }
  }

  const isMinimized = ["minimize", "foreground"].includes(
    store.state.windowState
  );

  const { channelId, communityId } = route.params;

  // Only show the notification when the the message is not from self & the active community & channel is different
  if (
    isMinimized ||
    (store.state.userDid !== authorDid &&
      (community?.perspective === communityId
        ? channel?.perspective !== channelId
        : true) &&
      !channel?.notifications.mute)
  ) {
    const notification = new Notification(`New message in ${community?.name}`, {
      body: `#${channel?.name}: ${message}`,
      icon: "/assets/images/junto_app_icon.png",
    });

    // Clicking on notification will take the user to that community & channel
    notification.onclick = () => {
      window.api.send("restoreWindow");

      router.push({
        name: "channel",
        params: {
          communityId: community!.perspective!,
          channelId: channel!.perspective!,
        },
      });
    };
  }
};
