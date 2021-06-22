import { Commit, Store } from "vuex";

import { createProfile } from "@/core/methods/createProfile";
import { createLink } from "@/core/mutations/createLink";
import { installSharedPerspective } from "@/core/mutations/installSharedPerspective";
import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";

import { Profile, ExpressionTypes, State } from "@/store";

export interface Payload {
  joiningLink: string;
}

export default async (store: any, { joiningLink }: Payload): Promise<void> => {
  try {
    const communities = store.state.communities;
    const isAlreadyPartOf = Object.values(communities).find(
      (c: any) => c.sharedPerspectiveUrl === joiningLink
    );
    if (!isAlreadyPartOf) {
      const installedPerspective = await installSharedPerspective(joiningLink);
      console.log(
        new Date(),
        "Installed perspective raw data",
        installedPerspective
      );

      //Get and cache the expression UI for each expression language
      //And used returned expression language names to populate typedExpressionLanguages field
      const typedExpressionLanguages = await getTypedExpressionLanguages(
        installedPerspective.sharedPerspective!,
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
        const addProfileLink = await createLink(installedPerspective.uuid!, {
          source: `${installedPerspective.sharedPerspective!.linkLanguages![0]!
            .address!}://self`,
          target: createProfileExpression,
          predicate: "sioc://has_member",
        });
        console.log("Created group expression link", addProfileLink);
      }

      store.commit("addCommunity", {
        name: installedPerspective.name,
        linkLanguageAddress:
          installedPerspective.sharedPerspective!.linkLanguages![0]!.address!,
        channels: {},
        perspective: installedPerspective.uuid!,
        expressionLanguages:
          installedPerspective.sharedPerspective!.requiredExpressionLanguages,
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
