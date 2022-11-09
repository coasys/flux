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

export default async function updateCommunityData(update: Payload): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const { communityId } = update;

  const community = dataStore.getCommunity(communityId);

  try {
    const { image, thumbnail, name, description } = await updateCommunity(update);

    dataStore.updateCommunityMetadata({
      communityId: community.uuid,
      name: name || community.name,
      description: description || community.description,
      image: image || community.image || "",
      thumbnail: thumbnail || community.thumbnail || "",
    });
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
