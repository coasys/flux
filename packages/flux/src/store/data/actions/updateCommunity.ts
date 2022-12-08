import { useAppStore } from "@/store/app";
import { useDataStore } from "..";
import CommunityModel from "utils/api/community";
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
} from "utils/helpers/profileHelpers";

export interface Payload {
  name?: string;
  description?: string;
  image?: string;
}

export default async function updateCommunityData(
  communityId: string,
  update: Payload
): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    const Community = new CommunityModel({ perspectiveUuid: communityId });

    let thumb = undefined;

    if (update.image) {
      const resizedImage = await resizeImage(dataURItoBlob(update.image), 100);
      thumb = await blobToDataURL(resizedImage);
    }

    const { name, description, image, thumbnail } = await Community.update("", {
      ...update,
      thumbnail: thumb,
    });

    dataStore.updateCommunityMetadata({
      communityId,
      metadata: {
        name,
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
