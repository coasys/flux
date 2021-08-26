import { getProfile } from "@/utils/profileHelpers";
import { getLinks } from "@/core/queries/getLinks";
import { LinkQuery } from "@perspect3vism/ad4m";
import { TimeoutCache } from "../../../utils/timeoutCache";

import { ExpressionTypes, ProfileExpression } from "@/store/types";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";

import { MEMBER } from "@/constants/neighbourhoodMeta";

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  const profiles: { [x: string]: ProfileExpression } = {};
  const cache = new TimeoutCache<ProfileExpression>(1000 * 60 * 5);

  try {
    const neighbourhood = dataStore.getNeighbourhood(id);

    const profileLinks = await getLinks(
      id,
      new LinkQuery({
        source: `${neighbourhood.neighbourhoodUrl!}://self`,
        predicate: MEMBER,
      })
    );

    const profileLang = neighbourhood?.typedExpressionLanguages.find(
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

      dataStore.setNeighbourhoodMembers({
        perspectiveUuid: id,
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
