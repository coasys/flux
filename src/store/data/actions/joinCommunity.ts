import { createProfile } from "@/core/methods/createProfile";
import { createLink } from "@/core/mutations/createLink";
import { joinNeighbourhood } from "@/core/mutations/joinNeighbourhood";
import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";
import { getMetaFromNeighbourhood } from "@/core/methods/getMetaFromNeighbourhood";

import { MEMBER } from "@/constants/neighbourhoodMeta";

import { Link } from "@perspect3vism/ad4m";

import { ExpressionTypes, CommunityState, MembraneType } from "@/store/types";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";

export interface Payload {
  joiningLink: string;
}

export default async ({ joiningLink }: Payload): Promise<void> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();

  try {
    const neighbourhoods = dataStore.getCommunityNeighbourhoods;
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
      const typedExpressionLanguages = await getTypedExpressionLanguages(
        neighbourhood.neighbourhood!.meta.links
      );

      const profileExpLang = typedExpressionLanguages.find(
        (val) => val.expressionType == ExpressionTypes.ProfileExpression
      );
      if (profileExpLang !== undefined) {
        const createProfileExpression = await createProfile(
          profileExpLang.languageAddress!,
          userStore.getProfile!
        );

        //Create link between perspective and group expression
        const addProfileLink = await createLink(neighbourhood.uuid, {
          source: `${neighbourhood.sharedUrl}://self`,
          target: createProfileExpression,
          predicate: MEMBER,
        } as Link);
        console.log("Created profile expression link", addProfileLink);
      } else {
        throw Error(
          "Could not find profile expression language for installed neighbourhood"
        );
      }

      //Read out metadata about the perspective from the meta
      const { name, description, creatorDid, createdAt } =
        getMetaFromNeighbourhood(neighbourhood.neighbourhood!.meta.links);

      const newCommunity = {
        neighbourhood: {
          createdAt,
          name,
          description,
          creatorDid,
          perspective: neighbourhood,
          typedExpressionLanguages: typedExpressionLanguages,
          neighbourhoodUrl: joiningLink,
          membraneType: MembraneType.Unique,
          linkedNeighbourhoods: [],
          linkedPerspectives: [],
          members: {},
          currentExpressionLinks: {},
          currentExpressionMessages: {},
        },
        state: {
          perspectiveUuid: neighbourhood.uuid,
          useLocalTheme: false,
          theme: {
            fontSize: "md",
            fontFamily: "Poppins",
            name: "light",
            hue: 270,
            saturation: 60,
          },
          currentChannelId: null,
        },
      } as CommunityState;

      dataStore.addCommunity(newCommunity);
    } else {
      const message = "You are already part of this group";

      appStore.showDangerToast({
        message,
      });

      throw new Error(message);
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
