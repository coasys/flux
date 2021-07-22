import { ChannelState, FeedType, MembraneType } from "@/store/types";
import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";
import { findNameFromMeta } from "./findNameFromMeta";
import { joinNeighbourhood } from "../mutations/joinNeighbourhood";
import { getPerspectiveSnapshot } from "../queries/getPerspective";

export async function joinChannelFromSharedLink(
  url: string
): Promise<ChannelState> {
  console.log("Starting sharedperspective join");
  const neighbourhood = await joinNeighbourhood(url);
  console.log(new Date(), "Joined neighbourhood with result", neighbourhood);

  const perspectiveSnapshot = await getPerspectiveSnapshot(neighbourhood.uuid);

  const typedExpressionLanguages = await getTypedExpressionLanguages(
    perspectiveSnapshot!,
    false
  );

  //Read out metadata about the perspective from the meta
  const name = findNameFromMeta(perspectiveSnapshot!);

  //TODO: derive membraneType from link on sharedPerspective
  //For now its hard coded inherited since we dont support anything else
  const now = new Date();
  //TODO: lets use a constructor on the ChannelState type
  return {
    name: name,
    hasNewMessages: false,
    perspective: neighbourhood,
    type: FeedType.Signaled,
    createdAt: now,
    linkLanguageAddress: "na",
    currentExpressionLinks: {},
    currentExpressionMessages: {},
    neighbourhoodUrl: url,
    membraneType: MembraneType.Inherited,
    groupExpressionRef: "",
    typedExpressionLanguages: typedExpressionLanguages,
    notifications: {
      mute: false,
    },
  } as ChannelState;
}
