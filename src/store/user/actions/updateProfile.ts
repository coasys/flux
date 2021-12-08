import { createProfile } from "@/core/methods/createProfile";
import { getExpression } from "@/core/queries/getExpression";

import { ExpressionTypes, Profile, ProfileExpression } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "..";
import { useDataStore } from "@/store/data";
import { profileCache } from "@/app";

export interface Payload {
  username?: string;
  profilePicture?: string;
  thumbnail?: string;
  bio?: string;
}

export default async (payload: Payload): Promise<void> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();

  const currentProfile = userStore.getProfile;
  const newProfile = {
    username: payload.username || currentProfile?.username,
    email: currentProfile?.email,
    givenName: currentProfile?.givenName,
    familyName: currentProfile?.familyName,
    profilePicture: payload.profilePicture || currentProfile?.profilePicture,
    thumbnailPicture: payload.thumbnail || currentProfile?.thumbnailPicture,
  } as Profile;
  userStore.setUserProfile(newProfile);

  try {
    const neighbourhoods = Object.values(dataStore.getCommunityNeighbourhoods);

    for (const neighbourhood of neighbourhoods) {
      const profileLanguage = (
        neighbourhood as any
      ).typedExpressionLanguages.find(
        (t: any) => t.expressionType == ExpressionTypes.ProfileExpression
      );
      const profileRef = `${
        profileLanguage!.languageAddress
      }://${userStore.getUser!.agent.did!}`;

      console.log("profileLanguage: ", profileLanguage);

      if (profileLanguage) {
        const exp = await createProfile(
          profileLanguage.languageAddress,
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
        await profileCache.set(profileRef, profileExp);
      } else {
        const errorMessage =
          "Expected to find profile expression language for this community";
        appStore.showDangerToast({
          message: errorMessage,
        });
        throw Error(errorMessage);
      }
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
