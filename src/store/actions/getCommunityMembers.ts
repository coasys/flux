import { getProfile, toProfile } from "@/utils/profileHelpers";
import { getLinks } from "@/core/queries/getLinks";
import { TimeoutCache } from "@/utils/timeoutCache";
import { Commit } from "vuex";
import { ExpressionTypes, Profile, State } from "..";
import type Expression from "@perspect3vism/ad4m/Expression";

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

  const cache = new TimeoutCache<Expression>(1000 * 60 * 60);

  try {
    const communities = state.communities;

    console.log(communityId, communities);

    const community = communities.find((c) => c.perspective === communityId);

    const profileLinks = await getLinks(
      communityId,
      `${community?.linkLanguageAddress}://self`,
      "sioc://has_member"
    );

    console.log("profileLinks:", profileLinks);

    const profileLang = community?.typedExpressionLanguages.find(
      (t) => t.expressionType === ExpressionTypes.ProfileExpression
    );

    if (profileLang) {
      for (const profileLink of profileLinks) {
        const did = `${profileLang.languageAddress}://${profileLink.author!
          .did!}`;
        const profile = cache.get(did);

        if (profile) {
          if (profiles[did] === undefined) {
            profiles[did] = profile;
          }
        } else {
          const profile = await getProfile(
            profileLang.languageAddress,
            profileLink.author!.did!
          );
          profiles[did] = Object.assign({}, profile);
          cache.set(did, profile);
        }
      }

      const profileList = Object.values(profiles);

      console.log("profiles", profileList);

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
