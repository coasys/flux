import { addPerspective } from "@/core/mutations/addPerspective";
import { createLink } from "@/core/mutations/createLink";
import { publishSharedPerspective } from "@/core/mutations/publishSharedPerspective";
import { getPerspective } from "@/core/queries/getPerspective";
import { getPubKeyForLanguage } from "@/core/queries/getPubKeyForLanguage";
import { ChannelState, FeedType, SyncLevel } from "..";

export async function createChannel(
  channelName: string,
  description: string,
  communityUuid: string,
  sourcePerspective: string,
  sourcePerspectiveLinkLanguage: string,
  expressionLangs: string[]
): Promise<ChannelState> {
  const channelPerspective = await addPerspective(
    channelName
  );
  console.log(
    "Created channel perspective with result",
    channelPerspective
  );

  //Publish the perspective and add a social-context backend
  const shareChannelPerspective = await publishSharedPerspective({
    uuid: channelPerspective.uuid!,
    name: channelName,
    description: description,
    type: "holochainChannel",
    uid: communityUuid,
    requiredExpressionLanguages: expressionLangs,
    allowedExpressionLanguages: expressionLangs,
  });
  console.log(
    "Shared channel perspective with result",
    shareChannelPerspective
  );

  //Get the perspective again so that we have the SharedPerspective URL
  const perspective = await getPerspective(channelPerspective.uuid!);
  console.log("Got the channel perspective back with result", perspective);

  //Link from source social context to new sharedperspective
  const addLinkToChannel = await createLink(sourcePerspective, {
    source: `${sourcePerspectiveLinkLanguage}://self`,
    target: perspective.sharedURL!,
    predicate: "sioc://has_space",
  });
  console.log(
    "Added link from source social context to new SharedPerspective with result",
    addLinkToChannel
  );

  //TODO: set a callback which will add another active_agent link in 10 minutes; callback should also call itself again 10 mins later
  //Note this is temporary code to check the functioning of signals; but it should actually remain in the logic later on (post base creation)
  const channelScPubKey = await getPubKeyForLanguage(
    shareChannelPerspective.linkLanguages![0]!.address!
  );
  console.log("Got pub key for social context channel", channelScPubKey);
  //TODO: this shouldnt really happen here and should instead happen inside the main loop in App.vue
  const addActiveAgentLink = await createLink(channelPerspective.uuid!, {
    source: "active_agent",
    target: channelScPubKey,
    predicate: "*",
  });
  console.log("Created active agent link with result", addActiveAgentLink);

  //Add link on channel social context declaring type
  const addChannelTypeLink = await createLink(channelPerspective.uuid!, {
    source: `${shareChannelPerspective.linkLanguages![0]!.address!}://self`,
    target: "sioc://space",
    predicate: "rdf://type",
  });
  console.log(
    "Added link on channel social context with result",
    addChannelTypeLink
  );

  const now = new Date();
  
  return {
    name: channelPerspective.name!,
    perspective: channelPerspective.uuid!,
    type: FeedType.Dm,
    lastSeenMessageTimestamp: now,
    firstSeenMessageTimestamp: now,
    createdAt: now,
    linkLanguageAddress:
      shareChannelPerspective.linkLanguages![0]!.address!,
    syncLevel: SyncLevel.Full,
    maxSyncSize: -1,
    currentExpressionLinks: [],
    currentExpressionMessages: [],
    sharedPerspectiveUrl: perspective.sharedURL!,
  };
}