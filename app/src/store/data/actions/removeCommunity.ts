import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { useAppStore } from "@/store/app";
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

    await client.perspective.remove(communityId);

    delete dataStore.communities[communityId];
    delete dataStore.neighbourhoods[communityId];

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
