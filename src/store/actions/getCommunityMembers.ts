import { getProfile } from "@/utils/profileHelpers";
import { getLinks } from "@/core/queries/getLinks";
import { Commit } from "vuex";
import { ExpressionTypes, State } from "..";
import type { Expression } from "@perspect3vism/ad4m";
import { LinkQuery } from "@perspect3vism/ad4m";
import { TimeoutCache } from "../../utils/timeoutCache";

export interface Context {
  commit: Commit;
  state: State;
}

export interface Payload {
  communityId: string;
}

export default async function (
  { commit, state }: Context,
  { communityId }: Payload
): Promise<void> {
  const profiles: { [x: string]: Expression } = {};
  const cache = new TimeoutCache<Expression>(1000 * 60 * 5);

  try {
    const communities = state.communities;

    const community = communities[communityId];

    const profileLinks = await getLinks(
      communityId,
      new LinkQuery({
        source: `${community.perspective.sharedUrl!}://self`,
        target: "sioc://has_member",
      })
    );

    const profileLang = community?.typedExpressionLanguages.find(
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

      commit("setCommunityMembers", {
        communityId,
        members: profileList,
      });
    } else {
      const errorMessage =
        "Expected to find profile expression language for this community";
      commit("showDangerToast", {
        message: errorMessage,
      });
      throw Error(errorMessage);
    }
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
}
