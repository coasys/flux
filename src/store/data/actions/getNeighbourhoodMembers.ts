import { getProfile } from "@/utils/profileHelpers";
import { getLinks } from "@/core/queries/getLinks";
import { LinkQuery } from "@perspect3vism/ad4m-types";
import { TimeoutCache } from "../../../utils/timeoutCache";

import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";
import { userActionContext } from "@/store/user/index";
import { ExpressionTypes, ProfileExpression } from "@/store/types";

export interface Payload {
  communityId: string;
}

export default async function (context: any, id: string): Promise<void> {
  const { state: dataState, commit: dataCommit } = dataActionContext(context);
  const { commit: appCommit, state: appState, getters: appGetters } = appActionContext(context);
  const { commit: userCommit, state: userState, getters: userGetters } = userActionContext(context);
  
  const profiles: { [x: string]: ProfileExpression } = {};
  const cache = new TimeoutCache<ProfileExpression>(1000 * 60 * 5);

  try {
    const communities = dataState.neighbourhoods;

    const community = communities[id];

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

      dataCommit.setCommunityMembers({
        communityId: id,
        members: profileList,
      });
    } else {
      const errorMessage =
        "Expected to find profile expression language for this community";
      appCommit.showDangerToast({
        message: errorMessage,
      });
      throw Error(errorMessage);
    }
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
