import { getAd4mClient } from '@perspect3vism/ad4m-connect/dist/web'
import { CHANNEL, LANGUAGE, SELF } from "@/constants/neighbourhoodMeta";
import { getMetaFromNeighbourhood } from "@/core/methods/getMetaFromNeighbourhood";
import { Ad4mClient, LinkExpression, LinkQuery, PerspectiveProxy } from "@perspect3vism/ad4m";
import { nanoid } from "nanoid";
import { useDataStore } from ".";
import { CommunityState, ExpressionTypes, FeedType, LocalCommunityState, MembraneType } from "../types";
import { getGroupExpression } from "./actions/fetchNeighbourhoodMetadata";

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
      fontFamily: "Poppins",
      name: "light",
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
  }

  if (community && community.state) {
    state = community.state;
  }

  const meta = getMetaFromNeighbourhood(perspective.neighbourhood?.meta?.links!);

  const metaLangs = perspective.neighbourhood?.meta?.links!.filter((link: any) => link.data.predicate === LANGUAGE);

  const typeLangs = await getMetaFromLinks(metaLangs!);

  const typedExpressionLanguages = typeLangs!.map((link: any) => ({
    languageAddress: link.address,
    expressionType: link.name.endsWith('group-expression') ? ExpressionTypes.GroupExpression : ExpressionTypes.Other,
  }));

  const groupExp = await getGroupExpression(perspective.uuid);

  return {
    neighbourhood: {
      name: groupExp?.name || meta.name,
      creatorDid: meta.creatorDid,
      description: groupExp?.description || meta.description,
      image: groupExp?.image || '',
      thumbnail: groupExp?.thumbnail || '',
      perspective: {
        uuid: perspective.uuid,
        name: perspective.name,
        sharedUrl: perspective.sharedUrl,
        neighbourhood: perspective.neighbourhood,
      },
      typedExpressionLanguages,
      groupExpressionRef: groupExp?.groupExpressionRef || typedExpressionLanguages.find((lang: any) => lang.expressionType === ExpressionTypes.GroupExpression)?.languageAddress,
      neighbourhoodUrl: perspective.sharedUrl,
      membraneType: MembraneType.Unique,
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
  const perspectives = await client.perspective.all();
  
  const communities = dataStore.getCommunities.filter((community) => !perspectives.map(e => e.uuid).includes(community.state.perspectiveUuid));

  for (const community of communities) {
    dataStore.removeCommunity({ communityId: community.state.perspectiveUuid });

    dataStore.clearChannels({ communityId: community.state.perspectiveUuid });
  }

  for (const perspective of perspectives) {
    const links = await client.perspective.queryLinks(perspective.uuid, new LinkQuery({
      source: SELF,
      predicate: CHANNEL
    }));

    if (links.length > 0) {
      if (perspective.sharedUrl !== undefined) {
        const newCommunity = await buildCommunity(perspective);


        console.log('newCommunity', newCommunity)

        dataStore.addCommunity(newCommunity);

        const channels = [...Object.values(dataStore.channels)]

        for (const link of links) {
          const exist = channels.find((channel: any) => channel.name === link.data.target && channel.sourcePerspective === perspective.uuid);
          
          if (!exist) {
            dataStore.addChannel({
              communityId: perspective.uuid,
              channel: {
                  id: nanoid(),
                  name: link.data.target,
                  creatorDid: link.author,
                  sourcePerspective: perspective.uuid,
                  hasNewMessages: false,
                  createdAt: new Date().toISOString(),
                  feedType: FeedType.Signaled,
                  notifications: {
                    mute: false,
                  },
              },
            });
          }
        }
      }
    }
  }
}