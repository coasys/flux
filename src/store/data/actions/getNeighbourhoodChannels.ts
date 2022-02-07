import { print } from "graphql/language/printer";
import { PERSPECTIVE_LINK_QUERY } from "@/core/graphql_queries";
import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";
import { channelRefreshDurationMs } from "@/constants/config";

export interface Payload {
  communityId: string;
}

const channelLinksWorker = new Worker("pollingWorker.js");

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async ({ communityId }: Payload): Promise<Worker> => {
  const dataStore = useDataStore();

  try {
    //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
    const community = dataStore.getCommunity(communityId);

    //Start the worker looking for channels
    channelLinksWorker.postMessage({
      interval: channelRefreshDurationMs,
      staticSleep: true,
      query: print(PERSPECTIVE_LINK_QUERY),
      variables: {
        uuid: community.neighbourhood.perspective.uuid,
        query: new LinkQuery({
          source: community.neighbourhood.neighbourhoodUrl,
          predicate: "sioc://has_space",
        }),
      },
      callbackData: { communityId: community.neighbourhood.perspective.uuid },
      name: `Channel links for ${community.neighbourhood.name}`,
      dataKey: "perspectiveQueryLinks",
    });

    channelLinksWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    channelLinksWorker.addEventListener("message", async (e) => {
      //Check that no other worker callback is executing
      try {
        const channelLinks = e.data.perspectiveQueryLinks;

        console.log(channelLinks);

        for (let i = 0; i < channelLinks.length; i++) {
          //Check that the channel is not in the store
          if (
            Object.values(community.neighbourhood.linkedNeighbourhoods).find(
              (neighbourhoodUrl) =>
                neighbourhoodUrl === channelLinks[i].data!.target
            ) === undefined
          ) {
            console.log(
              "Found channel link from un-joined channel neighbourhood",
              channelLinks[i]
            );
            //Call ad4m and try to join the sharedperspective found at link target
            await dataStore.joinChannelNeighbourhood({
              parentCommunityId: e.data.callbackData.communityId,
              neighbourhoodUrl: channelLinks[i].data!.target,
            });
          }
        }
      } catch (error) {
        throw new Error(error);
      }
    });
    return channelLinksWorker;
  } catch (e) {
    throw new Error(e);
  }
};
