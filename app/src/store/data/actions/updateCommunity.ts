import { useAppStore } from "@/store/app";
import { useDataStore } from "..";
import { Community as CommunityModel } from "utils/api";
import { blobToDataURL, dataURItoBlob, resizeImage } from "utils/helpers";
import { SubjectRepository } from "utils/factory";

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

  const community = dataStore.getCommunity(communityId);

  try {
    const Community = new SubjectRepository(CommunityModel, {
      perspectiveUuid: communityId,
    });

    let thumb = undefined;
    let compressedImage = undefined;

    if (update.image) {
      update.image = await blobToDataURL(
        await resizeImage(dataURItoBlob(update.image as string), 0.6)
      );

      // @ts-ignore
      update.thumbnail = await blobToDataURL(
        await resizeImage(dataURItoBlob(update.image as string), 0.3)
      );
    }

    await Community.update(community.id, {
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
        ...update
      }
    });
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
