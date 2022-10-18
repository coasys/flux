import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { CHANNEL, SELF } from "utils/constants/communityPredicates";
import { getMetaFromNeighbourhood } from "@/core/methods/getMetaFromNeighbourhood";
import { LinkExpression, Literal, PerspectiveProxy } from "@perspect3vism/ad4m";
import { useDataStore } from ".";
import { CommunityState, LocalCommunityState } from "../types";
import { getGroupMetadata } from "./actions/fetchNeighbourhoodMetadata";
import { useUserStore } from "../user";
import getProfile from "utils/api/getProfile";

export async function getMetaFromLinks(links: LinkExpression[]) {
  const client = await getAd4mClient();
  const langs = links.map((link) => client.languages.meta(link.data.target));
  return Promise.all(langs);
}

export async function buildCommunity(perspective: PerspectiveProxy) {
  const dataStore = useDataStore();
  const community = dataStore.getCommunity(perspective.uuid);

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

  if (community && community.state) {
    state = community.state;
  }

  const meta = getMetaFromNeighbourhood(
    perspective.neighbourhood?.meta?.links!
  );

  const groupExp = await getGroupMetadata(perspective.uuid);

  return {
    neighbourhood: {
      name: groupExp?.name || meta.name,
      creatorDid: meta.creatorDid,
      description: groupExp?.description || meta.description,
      image: groupExp?.image || "",
      thumbnail: groupExp?.thumbnail || "",
      perspective: {
        uuid: perspective.uuid,
        name: perspective.name,
        sharedUrl: perspective.sharedUrl,
        neighbourhood: perspective.neighbourhood,
      },
      neighbourhoodUrl: perspective.sharedUrl,
      linkedPerspectives: [perspective.uuid],
      linkedNeighbourhoods: [perspective.uuid],
      members: [meta.creatorDid],
      membraneRoot: perspective.uuid,
      createdAt: new Date().toISOString(),
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
    const channelLinks = await client.perspective.queryProlog(
      perspective.uuid,
      `triple("${SELF}", "${CHANNEL}", C).`
    );

    if (perspective.sharedUrl !== undefined && perspective.neighbourhood) {
      const newCommunity = await buildCommunity(perspective);

      dataStore.addCommunity(newCommunity);

      const channels = [...Object.values(dataStore.channels)];

      if (channelLinks) {
        for (const link of channelLinks) {
          try {
            const channel = link.C;
            const channelData = await Literal.fromUrl(channel).get();
            const exist = channels.find(
              (channel: any) =>
                channel.id === channel &&
                channel.sourcePerspective === perspective.uuid
            );
            if (!exist) {
              dataStore.addChannel({
                communityId: perspective.uuid,
                channel: {
                  id: channel,
                  name: channelData.data,
                  creatorDid: link.author,
                  sourcePerspective: perspective.uuid,
                  hasNewMessages: false,
                  createdAt: channelData.timestamp || new Date().toISOString(),
                  notifications: {
                    mute: false,
                  },
                },
              });
            }
          } catch (e) {
            console.error("Got error when trying to hydrate community channel state", e);
          }
        }
      }
    }
  }
}
