import { createProfile } from "@/core/methods/createProfile";
import { TimeoutCache } from "@/utils/timeoutCache";
import { getExpression } from "@/core/queries/getExpression";

import { ExpressionTypes, Profile, ProfileExpression } from "@/store/types";
import { rootActionContext } from "@/store/index";

export interface Payload {
  username?: string;
  profilePicture?: string;
  thumbnail?: string;
}

export default async (context: any, payload: Payload): Promise<void> => {
  const { commit, rootState, getters } = rootActionContext(context);

  const currentProfile = getters.getProfile;
  const newProfile = {
    username: payload.username || currentProfile?.username,
    email: currentProfile?.email,
    givenName: currentProfile?.givenName,
    familyName: currentProfile?.familyName,
    profilePicture: payload.profilePicture || currentProfile?.profilePicture,
    thumbnailPicture: payload.thumbnail || currentProfile?.thumbnailPicture,
  } as Profile;
  commit.setUserProfile(newProfile);

  try {
    const neighbourhoods = Object.values(rootState.data.neighbourhoods);
    const cache = new TimeoutCache<ProfileExpression>(1000 * 60 * 5);

    for (const neighbourhood of neighbourhoods) {
      const profileExpression = neighbourhood.typedExpressionLanguages.find(
        (t) => t.expressionType == ExpressionTypes.ProfileExpression
      );
      const didExpression = `${profileExpression!.languageAddress}://${rootState
        .user.agent.did!}`;

      console.log("profileExpression: ", profileExpression);

      if (profileExpression) {
        const exp = await createProfile(
          profileExpression.languageAddress,
          newProfile
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
