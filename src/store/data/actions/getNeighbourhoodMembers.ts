import { getProfile } from "@/utils/profileHelpers";
import { getLinks } from "@/core/queries/getLinks";
import { LinkQuery } from "@perspect3vism/ad4m-types";
import { TimeoutCache } from "../../../utils/timeoutCache";

import { rootActionContext } from "@/store/index";
import { ExpressionTypes, ProfileExpression } from "@/store/types";

export interface Payload {
  communityId: string;
}

export default async function (
  context: any,
  { communityId }: Payload
): Promise<void> {
  const { commit, rootState } = rootActionContext(context);
  const profiles: { [x: string]: ProfileExpression } = {};
  const cache = new TimeoutCache<ProfileExpression>(1000 * 60 * 5);

  try {
    const communities = rootState.data.neighbourhoods;

    const community = communities[communityId];

    const profileLinks = await getLinks(
      communityId,
      new LinkQuery({
        source: `${community.neighbourhoodUrl!}://self`,
        predicate: "sioc://has_member",
      })
    );
    console.log(profileLinks);

    const profileLang = community?.typedExpressionLanguages.find(
      (t) => t.expressionType === ExpressionTypes.ProfileExpression
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
