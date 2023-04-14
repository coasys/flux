import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { getMetaFromLinks } from "utils/helpers";
import { Ad4mClient, PerspectiveProxy } from "@perspect3vism/ad4m";
import { useDataStore } from ".";
import { CommunityState, LocalCommunityState } from "../types";
import { useUserStore } from "../user";
import { getProfile } from "utils/api";
import { Community as CommunityModel } from "utils/api";
import { SubjectRepository } from "utils/factory";

export async function buildCommunity(perspective: PerspectiveProxy) {
  let state: LocalCommunityState = {
    perspectiveUuid: perspective.uuid,
    theme: {
      fontSize: "md",
      fontFamily: "DM Sans",
      name: "default",
      hue: 270,
      saturation: 60,
    },
    useLocalTheme: false,
    currentChannelId: null,
    hideMutedChannels: false,
    hasNewMessages: false,
    collapseChannelList: false,
    notifications: {
      mute: false,
    },
  };

  const meta = getMetaFromLinks(perspective.neighbourhood?.meta?.links!);

  const Community = new SubjectRepository(CommunityModel, {
    perspectiveUuid: perspective.uuid,
  });

  const community = await Community.getData();

  return {
    neighbourhood: {
      uuid: perspective.uuid,
      author: meta.author,
      timestamp: new Date().toISOString(),
      name: community?.name || meta.name,
      description: community?.description || meta.description,
      image: community?.image || "",
      thumbnail: community?.thumbnail || "",
      neighbourhoodUrl: perspective.sharedUrl,
      members: [meta.author],
    },
    state,
  } as CommunityState;
}

export async function hydrateState() {
  const client: Ad4mClient = await getAd4mClient();
  const dataStore = useDataStore();
  const userStore = useUserStore();
  const perspectives = await client.perspective.all();
  const neighbourhoods = perspectives.filter((p) => p.sharedUrl);
  const status = await client.agent.status();

  const profile = await getProfile(status.did!);

  userStore.setUserProfile(profile!);

  userStore.updateAgentStatus(status);

  const deletedCommunities = dataStore.getCommunities.filter((community) => {
    const stillExist = neighbourhoods.some(
      (n) => n.uuid === community.state.perspectiveUuid
    );
    return !stillExist;
  });

  for (const community of deletedCommunities) {
    dataStore.removeCommunity({ communityId: community.state.perspectiveUuid });
    dataStore.clearChannels({ communityId: community.state.perspectiveUuid });
  }

  const newNeighbourhoods = neighbourhoods.filter((n) => {
    const found = dataStore.getCommunities.some(
      (c) => c.state.perspectiveUuid === n.uuid
    );
    return !found;
  });

  const newCommunities = await Promise.all(
    newNeighbourhoods.map((p) => buildCommunity(p))
  );

  newCommunities.forEach((c) => dataStore.addCommunity(c));
}
