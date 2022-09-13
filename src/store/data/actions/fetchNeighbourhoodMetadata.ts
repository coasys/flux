import { print } from "graphql/language/printer";
import { expressionGetRetries, expressionGetDelayMs } from "@/constants/config";
import { GET_EXPRESSION } from "@/core/graphql_queries";
import { LinkQuery } from "@perspect3vism/ad4m";

import { useDataStore } from "@/store/data/index";
import { ad4mClient } from "@/app";
import { SELF, FLUX_GROUP } from "@/constants/neighbourhoodMeta";
import { DexieIPFS } from "@/utils/storageHelpers";
import { getImage } from "../../../utils/profileHelpers";

export interface Payload {
  communityId: string;
}

export async function getGroupExpression(communityId: string) {
  const dataStore = useDataStore();
  const community = dataStore.getCommunity(communityId);
  const groupExpressionLinks = await ad4mClient.perspective.queryLinks(
    communityId,
    new LinkQuery({
      source: SELF,
      predicate: FLUX_GROUP,
    })
  );
  let sortedLinks = [...groupExpressionLinks];
  sortedLinks = sortedLinks.sort((a, b) => {
    return a.timestamp > b.timestamp ? 1 : b.timestamp > a.timestamp ? -1 : 0;
  });


  //Check that the group expression ref is not in the store
  if (sortedLinks.length > 0) {
    const dexie = new DexieIPFS(communityId);

    const exp = await ad4mClient.expression.get(sortedLinks[sortedLinks.length - 1].data!.target!)

    const groupExpData = JSON.parse(exp.data)

    if (groupExpData["image"]) {
      const image = await getImage(groupExpData["image"]);
  
      await dexie.save(groupExpData["image"], image);
    }

    if (groupExpData["thumbnail"]) {
      const thumbnail = await getImage(groupExpData["thumbnail"]);
  
      await dexie.save(groupExpData["thumbnail"], thumbnail);
    }

    return {
      communityId,
      name: groupExpData["name"],
      description: groupExpData["description"],
      image: groupExpData["image"],
      thumbnail: groupExpData["thumnail"],
      groupExpressionRef: sortedLinks[sortedLinks.length - 1].data!.target,
    }
  }

  return undefined
}

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const exp = await getGroupExpression(communityId);

  if (exp) {
    dataStore.updateCommunityMetadata(exp);
  }
};
