import { createProfile } from "@/core/methods/createProfile";
import { Commit } from "vuex";
import { ExpressionTypes, State, Profile, CommunityState } from "..";
import { TimeoutCache } from "../../utils/timeoutCache";
import type { Expression } from "@perspect3vism/ad4m-types";
import { getExpression } from "@/core/queries/getExpression";

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
  commit("setUserProfile", payload);

  try {
    const user: Profile | null = state.userProfile;

    const communities: CommunityState[] = Object.values(state.communities);
    const cache = new TimeoutCache<Expression>(1000 * 60 * 5);

    for (const community of communities) {
      const profileExpression = community.typedExpressionLanguages.find(
        (t) => t.expressionType == ExpressionTypes.ProfileExpression
      );
      const didExpression = `${
        profileExpression!.languageAddress
      }://${state.userDid!}`;

      console.log("profileExpression: ", profileExpression);

      if (profileExpression) {
        const exp = await createProfile(
          profileExpression.languageAddress,
          payload.username,
          user!.email,
          user!.givenName,
          user!.familyName,
          payload.profilePicture,
          payload.thumbnail
        );

        console.log("Created new profileExpression: ", exp);

        const expressionGql = await getExpression(exp);
        const profileExp = {
          author: expressionGql.author!,
          data: JSON.parse(expressionGql.data!),
          timestamp: expressionGql.timestamp!,
          proof: expressionGql.proof!,
        } as Expression;
        cache.set(didExpression, profileExp);
      } else {
        const errorMessage =
          "Expected to find profile expression language for this community";
        commit("showDangerToast", {
          message: errorMessage,
        });
        throw Error(errorMessage);
      }
    }
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
