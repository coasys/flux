import { createProfile } from "@/core/methods/createProfile";
import { createLink } from "@/core/mutations/createLink";
import { joinNeighbourhood } from "@/core/mutations/joinNeighbourhood";
import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";
import { findNameDescriptionFromMeta } from "@/core/methods/findNameDescriptionFromMeta";

import { Link } from "@perspect3vism/ad4m";

import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";
import { userActionContext } from "@/store/user/index";
import { ExpressionTypes, CommunityState, MembraneType } from "@/store/types";

export interface Payload {
  joiningLink: string;
}

export default async (
  context: any,
  { joiningLink }: Payload
): Promise<void> => {
  const { getters: dataGetters, commit: dataCommit } = dataActionContext(context);
  const { commit: appCommit } = appActionContext(context);
  const { getters: userGetters } = userActionContext(context);

  try {
    const neighbourhoods = dataGetters.getCommunityNeighbourhoods;
    const isAlreadyPartOf = Object.values(neighbourhoods).find(
      (c: any) => c.neighbourhoodUrl === joiningLink
    );
    if (!isAlreadyPartOf) {
      const neighbourhood = await joinNeighbourhood(joiningLink);
      console.log(
        new Date(),
        "Installed neighbourhood with result",
        neighbourhood
      );

      //Get and cache the expression UI for each expression language
      //And used returned expression language names to populate typedExpressionLanguages field
      const [typedExpressionLanguages, uiIcons] =
        await getTypedExpressionLanguages(
          neighbourhood.neighbourhood!.meta.links,
          true
        );

      for (const uiIcon of uiIcons) {
        appCommit.addExpressionUI(uiIcon);
      }

      const profileExpLang = typedExpressionLanguages.find(
        (val) => val.expressionType == ExpressionTypes.ProfileExpression
      );
      if (profileExpLang != undefined) {
        const createProfileExpression = await createProfile(
          profileExpLang.languageAddress!,
          userGetters.getProfile!
        );

        //Create link between perspective and group expression
        const addProfileLink = await createLink(neighbourhood.uuid, {
          source: `${neighbourhood.sharedUrl}://self`,
          target: createProfileExpression,
          predicate: "sioc://has_member",
        } as Link);
        console.log("Created profile expression link", addProfileLink);
      } else {
        throw Error(
          "Could not find profile expression language for installed neighbourhood"
        );
      }

      //Read out metadata about the perspective from the meta
      const { name, description } = findNameDescriptionFromMeta(
        neighbourhood.neighbourhood!.meta.links
      );

      const newCommunity = {
        neighbourhood: {
          name,
          description,
          perspective: neighbourhood,
          typedExpressionLanguages: typedExpressionLanguages,
          neighbourhoodUrl: joiningLink,
          membraneType: MembraneType.Unique,
          linkedNeighbourhoods: [],
          linkedPerspectives: [],
          members: [],
          currentExpressionLinks: {},
          currentExpressionMessages: {},
        },
        state: {
          perspectiveUuid: neighbourhood.uuid,
          useLocalTheme: false,
          theme: {
            fontSize: "md",
            fontFamily: "default",
            name: "light",
            hue: 270,
            saturation: 60,
          },
          currentChannelId: null,
        },
      } as CommunityState;

      dataCommit.addCommunity(newCommunity);
    } else {
      const message = "You are already part of this group";

      appCommit.showDangerToast({
        message,
      });

      throw new Error(message);
    }
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
