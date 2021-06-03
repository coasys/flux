import { Commit, Store } from "vuex";
import { CommunityState, JuntoExpressionReference, ExpressionTypes } from "..";
import {createExpression} from "@/core/mutations/createExpression";
import {createLink} from "@/core/mutations/createLink";

export interface Context {
    commit: Commit;
    getters: any;
}

export interface GroupExpressionData {
    name: string,
    description: string,
}

export interface Payload {
    community: CommunityState,
    groupExpressionData: GroupExpressionData
}

export default async function updateCommunity({commit, getters}: Context, {community, groupExpressionData}: Payload) {
    const groupExpressionLang = community.typedExpressionLanguages.find((val: JuntoExpressionReference) => val.expressionType == ExpressionTypes.GroupExpression);
    if (groupExpressionLang != undefined) {
      console.log("Found group exp lang", groupExpressionLang);
      const groupExpression = await createExpression(groupExpressionLang.languageAddress, JSON.stringify(groupExpressionData));
      console.log("Created new group expression for updateCommunity", groupExpression);

      const addGroupExpLink = await createLink(community.perspective, {
        source: `${community.sharedPerspectiveUrl}://self`,
        target: groupExpression,
        predicate: "rdf://class",
      });
      console.log("Created group expression link", addGroupExpLink);

      commit("updateCommunityMetadata", 
        {
          community: community.perspective, 
          name: groupExpressionData.name, 
          description: groupExpressionData.description, 
          groupExpressionRef: groupExpression
      })
    } else {
      throw Error("Expected to find group expression language for group")
    }
}