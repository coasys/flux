import { createProfile } from "@/core/methods/createProfile";
import { createLink } from "@/core/mutations/createLink";
import { joinNeighbourhood } from "@/core/mutations/joinNeighbourhood";
import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";

import { Profile, ExpressionTypes, State } from "@/store";
import { ad4mClient } from "@/app";
import { Link } from "@perspect3vism/ad4m";
import { findNameFromMeta } from "@/core/methods/findNameFromMeta";

export interface Payload {
  joiningLink: string;
}

export default async (store: any, { joiningLink }: Payload): Promise<void> => {
  try {
    const communities = store.state.communities;
    const isAlreadyPartOf = Object.values(communities).find(
      (c: any) => c.neighbourhoodUrl === joiningLink
    );
    if (!isAlreadyPartOf) {
      const neighourhood = await joinNeighbourhood(joiningLink);
      console.log(
        new Date(),
        "Installed neighourhood with result",
        neighourhood
      );

      const perspective = await ad4mClient.perspective.snapshotByUUID(neighourhood.uuid);

      //Get and cache the expression UI for each expression language
      //And used returned expression language names to populate typedExpressionLanguages field
      const typedExpressionLanguages = await getTypedExpressionLanguages(
        perspective!,
        true,
        store
      );

      const profileExpLang = typedExpressionLanguages.find(
        (val) => val.expressionType == ExpressionTypes.ProfileExpression
      );
      if (profileExpLang != undefined) {
        const profile: Profile = store.getters.getProfile;

        const createProfileExpression = await createProfile(
          profileExpLang.languageAddress!,
          profile.username,
          profile.email,
          profile.givenName,
          profile.familyName,
          profile.profilePicture,
          profile.thumbnailPicture
        );

        //Create link between perspective and group expression
        const addProfileLink = await createLink(neighourhood.uuid, {
          source: `${neighourhood.uuid}://self`,
          target: createProfileExpression,
          predicate: "sioc://has_member",
        } as Link);
        console.log("Created group expression link", addProfileLink);
      }

      //Read out metadata about the perspective from the meta
      let name = findNameFromMeta(perspective!);

      store.commit("addCommunity", {
        name: name,
        linkLanguageAddress: "na",
        channels: {},
        perspective: neighourhood,
        expressionLanguages: typedExpressionLanguages.forEach((lang) => lang.languageAddress),
        typedExpressionLanguages: typedExpressionLanguages,
        sharedPerspectiveUrl: joiningLink, //TODO: this will have to be string split once we add proof onto the URL
        members: [],
      });
    } else {
      const message = "You are already part of this group";

      store.commit("showDangerToast", {
        message,
      });
    }
  } catch (e) {
    store.commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
