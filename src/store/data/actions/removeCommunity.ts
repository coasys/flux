import { getAd4mClient } from '@perspect3vism/ad4m-connect/dist/web'
import { CHANNEL, SELF } from "@/constants/neighbourhoodMeta";
import { useAppStore } from "@/store/app";
import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";

export interface Payload {
  communityId: string;
  name?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
}

export default async function removeCommunity({
  communityId,
}: Payload): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    const client = await getAd4mClient();

    delete dataStore.communities[communityId];
    delete dataStore.neighbourhoods[communityId];
  
    //TODO: this should be a prolog query
    const channels = await client.perspective.queryLinks(communityId, new LinkQuery({
      source: SELF,
      predicate: CHANNEL
    }));
  
    const promises = [];
  
    for (const channel of channels) {
      promises.push(client.perspective.removeLink(communityId, channel));
    }
  
    await Promise.all(promises);
    
    for (const channel of Object.values(dataStore.channels)) {
      if (channel.sourcePerspective === communityId) {
        delete dataStore.channels[channel.id];
      }
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
