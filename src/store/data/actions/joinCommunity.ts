import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";
import { getMetaFromNeighbourhood } from "@/core/methods/getMetaFromNeighbourhood";

import { MEMBER, SELF } from "@/constants/neighbourhoodMeta";

import { Link, LinkQuery } from "@perspect3vism/ad4m";

import { CommunityState, MembraneType, FeedType } from "@/store/types";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { nanoid } from "nanoid";
import { getGroupExpression } from "./fetchNeighbourhoodMetadata";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

export interface Payload {
  joiningLink: string;
}

export default async ({ joiningLink }: Payload): Promise<void> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();
  const client = await getAd4mClient();

  try {
    const neighbourhoods = dataStore.getCommunityNeighbourhoods;
    const isAlreadyPartOf = Object.values(neighbourhoods).find(
      (c: any) => c.neighbourhoodUrl === joiningLink
    );
    if (!isAlreadyPartOf) {
      const neighbourhood = await client.neighbourhood.joinFromUrl(
        joiningLink
      );
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

      //Create member link between self and joining agent
      const addProfileLink = await client.perspective.addLink(
        neighbourhood.uuid,
        {
          source: SELF,
          target: userStore.agent.did,
          predicate: MEMBER,
        } as Link
      );
      console.log("Created profile expression link", addProfileLink);
        
      //Read out metadata about the perspective from the meta
      const { name, description, creatorDid, createdAt } =
        getMetaFromNeighbourhood(neighbourhood.neighbourhood!.meta.links);

      const groupExp = await getGroupExpression(neighbourhood.uuid);

      const newCommunity = {
        neighbourhood: {
          createdAt,
          name: groupExp?.name || name,
          description: groupExp?.description || description,
          image: groupExp?.image || "",
          thumbnail: groupExp?.thumbnail || "",
          creatorDid,
          perspective: neighbourhood,
          typedExpressionLanguages: typedExpressionLanguages,
          neighbourhoodUrl: joiningLink,
          membraneType: MembraneType.Unique,
          linkedNeighbourhoods: [neighbourhood.uuid],
          linkedPerspectives: [neighbourhood.uuid],
          members: [userStore.getUser!.agent.did!],
          membraneRoot: neighbourhood.uuid,
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
          hasNewMessages: false,
          collapseChannelList: false,
          hideMutedChannels: false,
          notifications: {
            mute: false,
          }
        },
      } as CommunityState;

      dataStore.addCommunity(newCommunity);

      // We add a default channel that is a reference to
      // the community itself. This way we can utilize the fractal nature of
      // neighbourhoods. Remember that this also need to happen in create community.
      dataStore.addChannel({
        communityId: neighbourhood.uuid,
        channel: {
          id: nanoid(),
          name: "Home",
          creatorDid: creatorDid,
          sourcePerspective: neighbourhood.uuid,
          hasNewMessages: false,
          createdAt: new Date().toISOString(),
          feedType: FeedType.Signaled,
          notifications: {
            mute: false,
          },
        },
      });
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
