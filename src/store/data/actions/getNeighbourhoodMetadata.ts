import { print } from "graphql/language/printer";
import {
  expressionGetRetries,
  expressionGetDelayMs,
  groupExpressionRefreshDurationMS,
} from "@/constants/config";
import { GET_EXPRESSION, PERSPECTIVE_LINK_QUERY } from "@/core/graphql_queries";
import { LinkQuery } from "@perspect3vism/ad4m";

import { useDataStore } from "@/store/data/index";

export interface Payload {
  communityId: string;
}

const token = localStorage.getItem('ad4minToken');

const expressionWorker = new Worker("/pollingWorker.js");

const PORT = localStorage.getItem('ad4minPort');

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async ({ communityId }: Payload): Promise<Worker> => {
  const dataStore = useDataStore();

  try {
    //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
    const community = dataStore.getCommunity(communityId);

    const groupExpressionWorker = new Worker("/pollingWorker.js");
    // Start worker looking for group expression links
    groupExpressionWorker.postMessage({
      interval: groupExpressionRefreshDurationMS,
      staticSleep: true,
      query: print(PERSPECTIVE_LINK_QUERY),
      token,
      variables: {
        uuid: community.neighbourhood.perspective.uuid,
        query: new LinkQuery({
          source: community.neighbourhood.neighbourhoodUrl,
          predicate: "rdf://class",
        }),
      },
      name: `Get group expression links for community: ${community.neighbourhood.name}`,
      port: PORT,
    });

    groupExpressionWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    //Add event listener for receiving links grabbed by the worker
    groupExpressionWorker.addEventListener("message", async (e) => {
      try {
        let groupExpressionLinks = e.data.perspectiveQueryLinks;
        //console.log("Got group expression links", groupExpressionLinks);
        if (groupExpressionLinks != null && groupExpressionLinks.length > 0) {
          groupExpressionLinks = e.data.perspectiveQueryLinks.sort(
            //@ts-ignore
            (a, b) =>
              a.timestamp > b.timestamp ? 1 : b.timestamp > a.timestamp ? -1 : 0
          );
          const latestExpression =
            groupExpressionLinks[groupExpressionLinks.length - 1].data!.target!;
          //Check that the group expression ref is not in the store
          if (community.neighbourhood.groupExpressionRef != latestExpression) {
            //Start a worker polling to try and get the expression data
            expressionWorker.postMessage({
              id: latestExpression,
              retry: expressionGetRetries,
              interval: expressionGetDelayMs,
              query: print(GET_EXPRESSION),
              token,
              variables: {
                url: latestExpression,
              },
              name: "Get group expression data",
              dataKey: "expression",
              port: PORT,
            });

            expressionWorker.onerror = function (e) {
              throw new Error(e.toString());
            };

            expressionWorker.addEventListener("message", (e) => {
              const getExpRes = e.data.expression;
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
            });
          }
        }
      } catch (error) {
        throw new Error(error);
      }
    });
    return groupExpressionWorker;
  } catch (e) {
    throw new Error(e);
  }
};
