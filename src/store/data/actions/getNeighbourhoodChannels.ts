import { print } from "graphql/language/printer";
import { joinChannelFromSharedLink } from "@/core/methods/joinChannelFromSharedLink";
import { PERSPECTIVE_LINK_QUERY } from "@/core/graphql_queries";
import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";

export interface Payload {
  communityId: string;
}

const channelLinksWorker = new Worker("pollingWorker.js");
let isCallbackRunning = false;

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async ({ communityId }: Payload): Promise<Worker> => {
  const dataStore = useDataStore();

  try {
    //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
    const community = dataStore.getCommunity(communityId);

    //Start the worker looking for channels
    channelLinksWorker.postMessage({
      interval: 10000,
      staticSleep: true,
      query: print(PERSPECTIVE_LINK_QUERY),
      variables: {
        uuid: community.neighbourhood.perspective.uuid,
        query: new LinkQuery({
          source: `${community.neighbourhood.neighbourhoodUrl}://self`,
          predicate: "sioc://has_space",
        }),
      },
      name: `Channel links for ${community.neighbourhood.name}`,
      dataKey: "perspectiveQueryLinks",
    });

    channelLinksWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    channelLinksWorker.addEventListener("message", async (e) => {
      if (!isCallbackRunning) {
        isCallbackRunning = true;
        //Check that no other worker callback is executing
        try {
          const channelLinks = e.data.perspectiveQueryLinks;

          for (let i = 0; i < channelLinks.length; i++) {
            //Check that the channel is not in the store
            if (
              Object.values(community.neighbourhood.linkedNeighbourhoods).find(
                (neighbourhoodUrl) =>
                  neighbourhoodUrl === channelLinks[i].data!.target
              ) == undefined
            ) {
              console.log(
                "Found channel link",
                channelLinks[i],
                "Adding to channel"
              );
              //Call ad4m and try to join the sharedperspective found at link target
              const channel = await joinChannelFromSharedLink(
                channelLinks[i].data!.target!,
                community.neighbourhood.perspective.uuid
              );
              console.log(
                "trying to join channel",
                channel,
                community.neighbourhood.perspective.uuid
              );
              //Add the channel to the store
              dataStore.addChannel({
                communityId: community.neighbourhood.perspective.uuid,
                channel: channel,
              });
              isCallbackRunning = false;
            }
          }
        } catch (error) {
          isCallbackRunning = false;
          throw new Error(error);
        }
      }
    });
    return channelLinksWorker;
  } catch (e) {
    throw new Error(e);
  }
};
