import { ChannelState, FeedType, MembraneType } from "@/store/types";
import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";
import { getMetaFromNeighbourhood } from "./getMetaFromNeighbourhood";
import { ad4mClient } from "@/app";

export async function joinChannelFromSharedLink(
  url: string,
  parentPerspectiveUUID: string
): Promise<ChannelState> {
  console.log("Starting sharedperspective join");
  const neighbourhood = await ad4mClient.neighbourhood.joinFromUrl(url);
  console.log(new Date(), "Joined neighbourhood with result", neighbourhood);

  const typedExpressionLanguages = await getTypedExpressionLanguages(
    neighbourhood.neighbourhood!.meta.links
  );

  //Read out metadata about the perspective from the meta
  const { name, description, creatorDid, createdAt } = getMetaFromNeighbourhood(
    neighbourhood.neighbourhood!.meta.links
  );

  //TODO: derive membraneType from link on sharedPerspective
  return {
    neighbourhood: {
      name: name,
      description: description,
      creatorDid: creatorDid,
      perspective: neighbourhood,
      typedExpressionLanguages: typedExpressionLanguages,
      neighbourhoodUrl: url,
      membraneType: MembraneType.Inherited,
      linkedPerspectives: [],
      linkedNeighbourhoods: [],
      members: [],
      currentExpressionLinks: {},
      currentExpressionMessages: {},
      createdAt: createdAt,
      membraneRoot: parentPerspectiveUUID,
    },
    state: {
      perspectiveUuid: neighbourhood.uuid,
      hasNewMessages: false,
      feedType: FeedType.Signaled,
      notifications: {
        mute: false,
      },
    },
  } as ChannelState;
}
