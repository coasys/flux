import { createExpression } from "@/core/mutations/createExpression";
import { createLink } from "@/core/mutations/createLink";

import { rootActionContext } from "@/store/index";
import { ExpressionTypes } from "@/store/types";

export interface Payload {
  communityId: string;
  name?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
}

export default async function updateCommunity(
  context: any,
  { communityId, name, description, image, thumbnail }: Payload
): Promise<void> {
  const { commit, getters } = rootActionContext(context);

  const community = getters.getCommunity(communityId);

  try {
    const groupExpressionLang =
      community.neighbourhood.typedExpressionLanguages.find(
        (val) => val.expressionType == ExpressionTypes.GroupExpression
      );

    if (groupExpressionLang != undefined) {
      console.log("Found group exp lang", groupExpressionLang);
      const groupExpression = await createExpression(
        groupExpressionLang.languageAddress,
        JSON.stringify({ name, description })
      );

      console.log(
        "Created new group expression for updateCommunity",
        groupExpression
      );

      const addGroupExpLink = await createLink(
        community.neighbourhood.perspective.uuid,
        {
          source: `${community.neighbourhood.neighbourhoodUrl}://self`,
          target: groupExpression,
          predicate: "rdf://class",
        }
      );
      console.log("Created group expression link", addGroupExpLink);

      commit.updateCommunityMetadata({
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
    commit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
