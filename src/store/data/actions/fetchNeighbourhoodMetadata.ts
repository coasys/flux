import { print } from "graphql/language/printer";
import { expressionGetRetries, expressionGetDelayMs } from "@/constants/config";
import { GET_EXPRESSION } from "@/core/graphql_queries";
import { LinkQuery } from "@perspect3vism/ad4m";

import { useDataStore } from "@/store/data/index";
import { ad4mClient } from "@/app";

export interface Payload {
  communityId: string;
}

const expressionWorker = new Worker("/pollingWorker.js");

const PORT = 12000;

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();
  const community = dataStore.getCommunity(communityId);

  const groupExpressionLinks = await ad4mClient.perspective.queryLinks(
    community.neighbourhood.perspective.uuid,
    new LinkQuery({
      source: community.neighbourhood.neighbourhoodUrl,
      predicate: "rdf://class",
    })
  );
  let sortedLinks = [...groupExpressionLinks];
  sortedLinks = sortedLinks.sort((a, b) => {
    console.log(a.timestamp, b.timestamp);
    return a.timestamp > b.timestamp ? 1 : b.timestamp > a.timestamp ? -1 : 0;
  });
  //Check that the group expression ref is not in the store
  if (
    sortedLinks.length > 0 &&
    community.neighbourhood.groupExpressionRef !=
      sortedLinks[sortedLinks.length - 1].data!.target!
  ) {
    //Start a worker polling to try and get the expression data
    expressionWorker.postMessage({
      retry: expressionGetRetries,
      interval: expressionGetDelayMs,
      query: print(GET_EXPRESSION),
      variables: {
        url: sortedLinks[sortedLinks.length - 1].data!.target!,
      },
      callbackData: { communityId: community.neighbourhood.perspective.uuid },
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
      console.log("Got new group expression data for community", groupExpData);
      //Update the community with the new group data
      dataStore.updateCommunityMetadata({
        communityId: e.data.callbackData.communityId,
        name: groupExpData["name"],
        description: groupExpData["description"],
        image: groupExpData["image"],
        thumbnail: groupExpData["thumnail"],
        groupExpressionRef: sortedLinks[sortedLinks.length - 1].data!.target,
      });
    });
  }
};
