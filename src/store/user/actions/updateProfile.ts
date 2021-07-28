import { createProfile } from "@/core/methods/createProfile";
import { TimeoutCache } from "@/utils/timeoutCache";
import { getExpression } from "@/core/queries/getExpression";

import { ExpressionTypes, Profile, ProfileExpression } from "@/store/types";
import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";
import { userActionContext } from "@/store/user/index";

export interface Payload {
  username?: string;
  profilePicture?: string;
  thumbnail?: string;
}

export default async (context: any, payload: Payload): Promise<void> => {
  const { state: dataState } = dataActionContext(context);
  const { commit: appCommit } = appActionContext(context);
  const {
    commit: userCommit,
    state: userState,
    getters: userGetters,
  } = userActionContext(context);

  const currentProfile = userGetters.getProfile;
  const newProfile = {
    username: payload.username || currentProfile?.username,
    email: currentProfile?.email,
    givenName: currentProfile?.givenName,
    familyName: currentProfile?.familyName,
    profilePicture: payload.profilePicture || currentProfile?.profilePicture,
    thumbnailPicture: payload.thumbnail || currentProfile?.thumbnailPicture,
  } as Profile;
  userCommit.setUserProfile(newProfile);

  try {
    const neighbourhoods = Object.values(dataState.neighbourhoods);
    const cache = new TimeoutCache<ProfileExpression>(1000 * 60 * 5);

    for (const neighbourhood of neighbourhoods) {
      const profileExpression = (
        neighbourhood as any
      ).typedExpressionLanguages.find(
        (t: any) => t.expressionType == ExpressionTypes.ProfileExpression
      );
      const didExpression = `${profileExpression!.languageAddress}://${userState
        .agent.did!}`;

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
        appCommit.showDangerToast({
          message: errorMessage,
        });
        throw Error(errorMessage);
      }
    }
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
