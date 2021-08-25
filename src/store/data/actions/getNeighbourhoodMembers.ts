import { getProfile } from "@/utils/profileHelpers";
import { getLinks } from "@/core/queries/getLinks";
import { LinkQuery } from "@perspect3vism/ad4m";
import { TimeoutCache } from "../../../utils/timeoutCache";

import { ExpressionTypes, ProfileExpression } from "@/store/types";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";

export interface Payload {
  communityId: string;
}

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  const profiles: { [x: string]: ProfileExpression } = {};
  const cache = new TimeoutCache<ProfileExpression>(1000 * 60 * 5);

  try {
    const community = dataStore.getNeighbourhood(id);

    const profileLinks = await getLinks(
      id,
      new LinkQuery({
        source: `${community.neighbourhoodUrl!}://self`,
        predicate: "sioc://has_member",
      })
    );

    const profileLang = community?.typedExpressionLanguages.find(
      (t: any) => t.expressionType === ExpressionTypes.ProfileExpression
    );

    if (profileLang) {
      for (const profileLink of profileLinks) {
        const did = `${profileLang.languageAddress}://${profileLink.author}`;

        //TODO: we should store the whole profile in the store but just the did and then resolve the profile via cache/network
        const profile = await getProfile(
          profileLang.languageAddress,
          profileLink.author
        );

        if (profile) {
          profiles[did] = Object.assign({}, profile);
          cache.set(did, profile);
        }
      }

      const profileList = Object.values(profiles);

      dataStore.setCommunityMembers({
        communityId: id,
        members: profileList,
      });
    } else {
      const errorMessage =
        "Expected to find profile expression language for this community";
      appStore.showDangerToast({
        message: errorMessage,
      });
      throw Error(errorMessage);
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
