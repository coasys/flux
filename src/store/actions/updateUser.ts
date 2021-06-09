import { createProfile } from "@/core/methods/createProfile";
import { createLink } from "@/core/mutations/createLink";
import { Commit } from "vuex";
import { ExpressionTypes, State } from "..";

export interface Context {
  commit: Commit;
  state: State;
}

export interface Payload {
  username: string;
  profilePicture: string;
  thumbnail: string;
}

export default async (
  { commit, state }: Context,
  payload: Payload
): Promise<any> => {
  // TODO:  GraphQL Mutation
  commit("setUserProfile", payload);

  const user = state.userProfile;

  const communities = state.communities;

  console.log(payload);

  for (const community of communities) {
    const profileExpression = community.typedExpressionLanguages.find(
      (t) => t.expressionType == ExpressionTypes.ProfileExpression
    );

    console.log("profileExpression: ", profileExpression);

    if (profileExpression) {
      const exp = await createProfile(
        profileExpression.languageAddress,
        payload.username,
        user?.email,
        user?.givenName,
        user?.familyName,
        payload.profilePicture,
        payload.thumbnail
      );

      console.log("profileExpression: ", exp);

      const profileLink = await createLink(community.perspective, {
        source: `${community.linkLanguageAddress}://self`,
        target: exp,
        predicate: "sioc://has_member",
      });

      console.log("Created group expression link", profileLink);
    }
  }
};
