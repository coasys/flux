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

  try {
    const Community = new SubjectRepository(CommunityModel, {
      perspectiveUuid: communityId,
    });

    // @ts-ignore
    Object.keys(update).forEach(key => update[key] === undefined ? delete update[key] : {});

    let thumb = undefined;
    let compressedImage = undefined;

    if (update.image) {
      compressedImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(update.image as string), 0.6)
      );
      thumb = await blobToDataURL(
        await resizeImage(dataURItoBlob(update.image as string), 0.3)
      );
    }

    await Community.update("", {
      ...update,
      image: compressedImage,
      thumbnail: thumb,
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
