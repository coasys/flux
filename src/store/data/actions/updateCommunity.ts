import { createExpression } from "@/core/mutations/createExpression";
import { createLink } from "@/core/mutations/createLink";

import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";
import { ExpressionTypes } from "@/store/types";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateCommunity(
  context: any,
  { communityId, name, description }: Payload
): Promise<void> {
  const { commit: dataCommit, getters: dataGetters } =
    dataActionContext(context);
  const { commit: appCommit } = appActionContext(context);

  const community = dataGetters.getCommunity(communityId);

  try {
    const groupExpressionLang =
      community.neighbourhood.typedExpressionLanguages.find(
        (val: any) => val.expressionType == ExpressionTypes.GroupExpression
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

      dataCommit.updateCommunityMetadata({
        communityId: community.neighbourhood.perspective.uuid,
        name: name,
        description: description,
        groupExpressionRef: groupExpression,
      });
    } else {
      throw Error("Expected to find group expression language for group");
    }
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
