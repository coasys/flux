import { getProfile } from "@/utils/profileHelpers";
import { getLinks } from "@/core/queries/getLinks";
import { TimeoutCache } from "@/utils/timeoutCache";
import { LinkQuery } from "@perspect3vism/ad4m-types";
import type { Expression } from "@perspect3vism/ad4m-types";

import { rootActionContext } from "@/store";
import { ExpressionTypes } from "@/store/types";

export default async function (
  context: any,
  communityId: string
): Promise<void> {
  const { commit, getters } = rootActionContext(context);

  const profiles: { [x: string]: Expression } = {};
  const cache = new TimeoutCache<Expression>(1000 * 60 * 5);

  try {
    const community = getters.getCommunity(communityId);

    const profileLinks = await getLinks(
      communityId,
      new LinkQuery({
        source: `${community.neighbourhood.neighbourhoodUrl}://self`,
        predicate: "sioc://has_member",
      })
    );

    const profileLang = community.neighbourhood.typedExpressionLanguages.find(
      (t) => t.expressionType === ExpressionTypes.ProfileExpression
    );

    if (profileLang) {
      for (const profileLink of profileLinks) {
        const did = `${profileLang.languageAddress}://${profileLink.author!
          .did!}`;

        //TODO: we should store the whole profile in the store but just the did and then resolve the profile via cache/network
        const profile = await getProfile(
          profileLang.languageAddress,
          profileLink.author!.did!
        );

        if (profile) {
          profiles[did] = Object.assign({}, profile);
          cache.set(did, profile);
        }
      }

      const profileList = Object.values(profiles);

      commit.setCommunityMembers({
        communityId,
        members: profileList,
      });
    } else {
      const errorMessage =
        "Expected to find profile expression language for this community";
      commit.showDangerToast({
        message: errorMessage,
      });
      throw Error(errorMessage);
    }
  } catch (e) {
    commit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
