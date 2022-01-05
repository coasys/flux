import { ad4mClient } from "@/app";
import { useAppStore } from "@/store/app";

import { ExpressionTypes } from "@/store/types";
import { useDataStore } from "..";

export interface Payload {
  communityId: string;
  name?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
}

export default async function updateCommunity({
  communityId,
  name,
  description,
  image,
  thumbnail,
}: Payload): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  const community = dataStore.getCommunity(communityId);

  try {
    const groupExpressionLang =
      community.neighbourhood.typedExpressionLanguages.find(
        (val: any) => val.expressionType == ExpressionTypes.GroupExpression
      );

    if (groupExpressionLang != undefined) {
      console.log("Found group exp lang", groupExpressionLang);
      const groupExpression = await ad4mClient.expression.create(
        { name, description, image, thumbnail },
        groupExpressionLang.languageAddress
      );

      console.log(
        "Created new group expression for updateCommunity",
        groupExpression
      );

      const addGroupExpLink = await ad4mClient.perspective.addLink(
        community.neighbourhood.perspective.uuid,
        {
          source: `${community.neighbourhood.neighbourhoodUrl}://self`,
          target: groupExpression,
          predicate: "rdf://class",
        }
      );
      console.log("Created group expression link", addGroupExpLink);

      dataStore.updateCommunityMetadata({
        communityId: community.neighbourhood.perspective.uuid,
        name: name || community.neighbourhood.name,
        description: description || community.neighbourhood.description,
        image: image || community.neighbourhood.image || "",
        thumbnail: thumbnail || community.neighbourhood.thumbnail || "",
        groupExpressionRef: groupExpression,
      });
    } else {
      throw Error("Expected to find group expression language for group");
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
