import { Commit } from "vuex";
import { JuntoExpressionReference, ExpressionTypes } from "..";
import { createExpression } from "@/core/mutations/createExpression";
import { createLink } from "@/core/mutations/createLink";

export interface Context {
  commit: Commit;
  getters: any;
}

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateCommunity(
  { commit, getters }: Context,
  { communityId, name, description }: Payload
): Promise<void> {
  const community = getters.getCommunity(communityId);

  try {
    const groupExpressionLang = community.typedExpressionLanguages.find(
      (val: JuntoExpressionReference) =>
        val.expressionType == ExpressionTypes.GroupExpression
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

      const addGroupExpLink = await createLink(community.perspective, {
        source: `${community.linkLanguageAddress}://self`,
        target: groupExpression,
        predicate: "rdf://class",
      });
      console.log("Created group expression link", addGroupExpLink);

      commit("updateCommunityMetadata", {
        communityId: community.perspective,
        name: name,
        description: description,
        groupExpressionRef: groupExpression,
      });
    } else {
      throw Error("Expected to find group expression language for group");
    }
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
}
