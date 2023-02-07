import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Factory, getMetaFromLinks } from "utils/helpers";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useDataStore } from ".";
import { CommunityState, LocalCommunityState } from "../types";
import { useUserStore } from "../user";
import { getProfile } from "utils/api";
import { Community as CommunityModel } from "utils/api";
import { SubjectRepository } from "utils/factory";

export async function buildCommunity(perspective: PerspectiveProxy) {
  const dataStore = useDataStore();
  const communityState = dataStore.getLocalCommunityState(perspective.uuid);

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

  if (communityState && communityState) {
    state = communityState;
  }

  const meta = getMetaFromLinks(perspective.neighbourhood?.meta?.links!);

  console.log("test");

  console.log("ensured");

  const Community = new SubjectRepository(CommunityModel, {
    perspectiveUuid: perspective.uuid,
  });

  const community = await Community.get();

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
  const client = await getAd4mClient();
  const dataStore = useDataStore();
  const userStore = useUserStore();
  const perspectives = await client.perspective.all();
  const status = await client.agent.status();

  const profile = await getProfile(status.did!);

  userStore.setUserProfile(profile!);

  userStore.updateAgentStatus(status);

  const communities = dataStore.getCommunities.filter(
    (community) =>
      !perspectives.map((e) => e.uuid).includes(community.state.perspectiveUuid)
  );

  for (const community of communities) {
    dataStore.removeCommunity({ communityId: community.state.perspectiveUuid });

    dataStore.clearChannels({ communityId: community.state.perspectiveUuid });
  }

  for (const perspective of perspectives) {
    const hasCommunityAlready = dataStore.getCommunities.find(
      (c) => c.state.perspectiveUuid === perspective.uuid
    );

    if (hasCommunityAlready) return;

    if (perspective.sharedUrl !== undefined && perspective.neighbourhood) {
      console.log("build com");
      const newCommunity = await buildCommunity(perspective);

      dataStore.addCommunity(newCommunity);
    }
  }
}
