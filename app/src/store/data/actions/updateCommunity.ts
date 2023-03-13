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
    let compressedImage = undefined;

    if (update.image) {
      compressedImage = await blobToDataURL(await resizeImage(dataURItoBlob(update.image as string), 0.6));
      thumb = await blobToDataURL(await resizeImage(dataURItoBlob(update.image as string), 0.3));
    }

    const { name, description, image, thumbnail } = await Community.update("", {
      ...update,
      image: compressedImage ? {
        data_base64: compressedImage,
        name: "community-image",
        file_type: "image/png",
      } : undefined,
      thumbnail: thumb ? {
        data_base64: thumb,
        name: "community-image",
        file_type: "image/png",
      } : undefined
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
