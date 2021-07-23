import { createProfile } from "@/core/methods/createProfile";
import { TimeoutCache } from "@/utils/timeoutCache";
import type { Expression } from "@perspect3vism/ad4m-types";
import { getExpression } from "@/core/queries/getExpression";

import { ExpressionTypes, Profile, ProfileExpression } from "@/store/types";
import { rootActionContext, rootGetterContext } from "@/store/index";

export interface Payload {
  username: string;
  profilePicture: string;
  thumbnail: string;
}

export default async (context: any, payload: Payload): Promise<void> => {
  const { getters } = rootGetterContext(context);
  const { commit, state } = rootActionContext(context);

  const currentProfile = getters.getProfile;
  const newProfile = {
    username: currentProfile?.username,
    email: currentProfile?.email,
    givenName: currentProfile?.givenName,
    familyName: currentProfile?.familyName,
    profilePicture: currentProfile?.profilePicture,
    thumbnailPicture: currentProfile?.thumbnailPicture,
  } as Profile;
  newProfile.username = payload.username;
  newProfile.profilePicture = payload.profilePicture;
  commit.setUserProfile(newProfile);

  try {
    const user = state.user.profile;

    const neighbourhoods = Object.values(state.data.neighbourhoods);
    const cache = new TimeoutCache<ProfileExpression>(1000 * 60 * 5);

    for (const neighbourhood of neighbourhoods) {
      const profileExpression = neighbourhood.typedExpressionLanguages.find(
        (t) => t.expressionType == ExpressionTypes.ProfileExpression
      );
      const didExpression = `${profileExpression!.languageAddress}://${state
        .user.agent.did!}`;

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
        } as ProfileExpression;
        cache.set(didExpression, profileExp);
      } else {
        const errorMessage =
          "Expected to find profile expression language for this community";
        commit.showDangerToast({
          message: errorMessage,
        });
        throw Error(errorMessage);
      }
    }
  } catch (e) {
    commit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
