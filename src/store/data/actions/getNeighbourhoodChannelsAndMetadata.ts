import { print } from "graphql/language/printer";
import { joinChannelFromSharedLink } from "@/core/methods/joinChannelFromSharedLink";
import { expressionGetRetries, expressionGetDelayMs } from "@/core/juntoTypes";
import { GET_EXPRESSION, PERSPECTIVE_LINK_QUERY } from "@/core/graphql_queries";
import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";

export interface Payload {
  communityId: string;
}

export interface Response {
  channelLinksWorker: Worker;
  groupExpressionWorker: Worker;
}

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async (
  { communityId }: Payload
): Promise<Response> => {
  console.log("Getting community channel links for community: ", communityId);

  const dataStore = useDataStore();

  try {
    //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
    const community = dataStore.getCommunity(communityId);
    const channelLinksWorker = new Worker("pollingWorker.js");
    //Use global isExecuting variable so that message callbacks on channel worker do not execute at the same time and both mutate state
    let isExecuting = false;

    //Start the worker looking for channels
    channelLinksWorker.postMessage({
      interval: 5000,
      query: print(PERSPECTIVE_LINK_QUERY),
      variables: {
        uuid: community.neighbourhood.perspective.uuid,
        query: new LinkQuery({
          source: `${community.neighbourhood.neighbourhoodUrl}://self`,
          predicate: "sioc://has_space",
        }),
      },
      name: "Community channel links",
    });

    channelLinksWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    channelLinksWorker.addEventListener("message", async (e) => {
      //Check that no other worker callback is executing
      if (!isExecuting) {
        isExecuting = true;
        try {
          const channelLinks = e.data.perspectiveQueryLinks;

          if (channelLinks) {
            for (let i = 0; i < channelLinks.length; i++) {
              //Check that the channel is not in the store
              if (
                Object.values(
                  community.neighbourhood.linkedNeighbourhoods
                ).find(
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
              }
            }
          }
          isExecuting = false;
        } catch (error) {
          throw new Error(error);
        }
      }
    });

    const groupExpressionWorker = new Worker("pollingWorker.js");

    // Start worker looking for group expression links
    groupExpressionWorker.postMessage({
      interval: 5000,
      query: print(PERSPECTIVE_LINK_QUERY),
      variables: {
        uuid: community.neighbourhood.perspective.uuid,
        query: new LinkQuery({
          source: `${community.neighbourhood.neighbourhoodUrl}://self`,
          predicate: "rdf://class",
        }),
      },
      name: `Get group expression links ${community.neighbourhood.name}`,
    });

    groupExpressionWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    //Add event listener for receiving links grabbed by the worker
    groupExpressionWorker.addEventListener("message", async (e) => {
      try {
        const groupExpressionLinks = e.data.perspectiveQueryLinks;
        //console.log("Got group expression links", groupExpressionLinks);
        if (groupExpressionLinks != null && groupExpressionLinks.length > 0) {
          //Check that the group expression ref is not in the store
          if (
            community.neighbourhood.groupExpressionRef !=
            groupExpressionLinks[groupExpressionLinks.length - 1].data!.target!
          ) {
            const expressionWorker = new Worker("pollingWorker.js");

            //Start a worker polling to try and get the expression data
            expressionWorker.postMessage({
              retry: expressionGetRetries,
              interval: expressionGetDelayMs,
              query: print(GET_EXPRESSION),
              variables: {
                url: groupExpressionLinks[groupExpressionLinks.length - 1].data!
                  .target!,
              },
              name: "Get group expression data",
            });

            expressionWorker.onerror = function (e) {
              throw new Error(e.toString());
            };

            expressionWorker.addEventListener("message", (e) => {
              const getExpRes = e.data.expression;
              //If not null
              if (getExpRes) {
                //Terminate expression worker loop
                expressionWorker.terminate();
                const groupExpData = JSON.parse(getExpRes.data!);
                console.log(
                  "Got new group expression data for community",
                  groupExpData
                );
                //Update the community with the new group data
                dataStore.updateCommunityMetadata({
                  communityId: community.neighbourhood.perspective.uuid,
                  name: groupExpData["name"],
                  description: groupExpData["description"],
                  image: groupExpData["image"],
                  thumbnail: groupExpData["thumnail"],
                  groupExpressionRef:
                    groupExpressionLinks[groupExpressionLinks.length - 1].data!
                      .target,
                });
              }
            });
          }
        }
      } catch (error) {
        throw new Error(error);
      }
    });
    return { channelLinksWorker, groupExpressionWorker };
  } catch (e) {
    throw new Error(e);
  }
};
