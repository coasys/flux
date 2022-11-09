import { getMetaFromNeighbourhood } from "utils/helpers/getMetaFromNeighbourhood";

import { MEMBER, SELF } from "utils/constants/communityPredicates";

import { Link } from "@perspect3vism/ad4m";

import { CommunityState } from "@/store/types";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { getCommunityMetadata } from "utils/api/getCommunityMetadata";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

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
      const neighbourhood = await client.neighbourhood.joinFromUrl(joiningLink);
      console.log(
        new Date(),
        "Installed neighbourhood with result",
        neighbourhood
      );

      //Create member link between self and joining agent
      const addProfileLink = await client.perspective.addLink(
        neighbourhood.uuid,
        {
          source: SELF,
          target: `did://${userStore.agent.did}`,
          predicate: MEMBER,
        } as Link
      );
      console.log("Created profile expression link", addProfileLink);

      //Read out metadata about the perspective from the meta
      const { name, description, creatorDid, createdAt } =
        getMetaFromNeighbourhood(neighbourhood.neighbourhood!.meta.links);

      const groupExp = await getCommunityMetadata(neighbourhood.uuid);

      const newCommunity = {
        neighbourhood: {
          createdAt,
          name: groupExp?.name || name,
          description: groupExp?.description || description,
          image: groupExp?.image || "",
          thumbnail: groupExp?.thumbnail || "",
          creatorDid,
          perspective: neighbourhood,
          neighbourhoodUrl: joiningLink,
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
          },
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
