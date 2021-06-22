import { getProfile, toProfile } from "@/utils/profileHelpers";
import { getLinks } from "@/core/queries/getLinks";
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

  try {
    const communities = state.communities;

    const community = communities[communityId];

    const profileLinks = await getLinks(
      communityId,
      `${community?.linkLanguageAddress}://self`,
      "sioc://has_member"
    );

    const profileLang = community?.typedExpressionLanguages.find(
      (t) => t.expressionType === ExpressionTypes.ProfileExpression
    );

    if (profileLang) {
      for (const profileLink of profileLinks) {
        const did = `${profileLang.languageAddress}://${profileLink.author!
          .did!}`;

        const profile = await getProfile(
          profileLang.languageAddress,
          profileLink.author!.did!
        );

        if (profile) {
          profiles[did] = Object.assign({}, profile);
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
