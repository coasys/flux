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
  const appStore = useAppStore();

  try {
    const client = await getAd4mClient();

    await client.perspective.remove(communityId);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
