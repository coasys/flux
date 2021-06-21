import { addPerspective } from "@/core/mutations/addPerspective";
import { createLink } from "@/core/mutations/createLink";
import { publishSharedPerspective } from "@/core/mutations/publishSharedPerspective";
import { getPerspective } from "@/core/queries/getPerspective";
import {
  ChannelState,
  FeedType,
  MembraneType,
  JuntoExpressionReference,
} from "@/store";

export async function createChannel(
  channelName: string,
  description: string,
  communityUuid: string,
  sourcePerspective: string,
  sourcePerspectiveLinkLanguage: string,
  expressionLangs: string[],
  membraneType: MembraneType,
  typedExpressionLanguages: JuntoExpressionReference[]
): Promise<ChannelState> {
  const channelPerspective = await addPerspective(channelName);
  console.log("Created channel perspective with result", channelPerspective);

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
    hasUnseenMessages: false,
    perspective: channelPerspective.uuid!,
    type: FeedType.Signaled,
    createdAt: now,
    linkLanguageAddress: shareChannelPerspective.linkLanguages![0]!.address!,
    currentExpressionLinks: [],
    currentExpressionMessages: [],
    sharedPerspectiveUrl: perspective.sharedURL!,
    membraneType: membraneType,
    groupExpressionRef: "",
    typedExpressionLanguages: typedExpressionLanguages,
  };
}
