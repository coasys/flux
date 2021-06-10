import { createProfile } from "@/core/methods/createProfile";
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
  commit("setUserProfile", payload);

  try {
    const user = state.userProfile;
  
    const communities = state.communities;
  
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
      } else {
        const errorMessage = "Expected to find profile expression language for this community";
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
