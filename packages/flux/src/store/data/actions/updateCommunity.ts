import { useAppStore } from "@/store/app";
import { useDataStore } from "..";
import { updateCommunity } from "utils/api/updateCommunity";

export interface Payload {
  communityId: string;
  name?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
}

export default async function updateCommunityData(
  update: Payload
): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const { communityId } = update;

  try {
    const { name, description, image, thumbnail } = await updateCommunity(
      update
    );

    dataStore.updateCommunityMetadata({
      communityId,
      metadata: {
        name: name!,
        description,
        image,
        thumbnail,
      },
    });
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
