import { ChannelState, CommunityState, ExpressionTypes, State } from "@/store";
import { RouteLocationNormalizedLoaded, Router, useRoute, useRouter } from "vue-router";
import { Store, useStore } from "vuex";
import { getProfile } from "./profileHelpers";

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

  // Fetch the user profile to check if this is the current user
  const profile = await getProfile(
    community!.typedExpressionLanguages.find(
      (t) => t.expressionType === ExpressionTypes.ProfileExpression
    )!.languageAddress!,
    authorDid
  );

  const { channelId, communityId } = route.params;

  // Only show the notification when the the message is not from self & the active community & channel is different
  if (
    profile?.author.did !== authorDid &&
    community?.perspective !== communityId &&
    channel?.perspective !== channelId &&
    !channel?.notifications.mute
  ) {
    const notification = new Notification(
      `New message in ${community?.name}`,
      {
        body: `#${channel?.name}: ${message}`,
        icon: "/assets/images/junto_app_icon.png",
      }
    );

    // Clicking on notification will take the user to that community & channel
    notification.onclick = () => {
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
