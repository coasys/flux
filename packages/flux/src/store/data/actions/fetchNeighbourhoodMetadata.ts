import { useDataStore } from "@/store/data/index";
import {
  SELF,
  FLUX_GROUP_NAME,
  FLUX_GROUP_DESCRIPTION,
  FLUX_GROUP_IMAGE,
  FLUX_GROUP_THUMBNAIL,
} from "utils/constants/neighbourhoodMeta";
import { DexieIPFS } from "@/utils/storageHelpers";
import { getImage } from "utils/api/getProfile";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";
import { Literal } from "@perspect3vism/ad4m";

export interface Payload {
  communityId: string;
}

export async function getGroupMetadata(communityId: string): Promise<{
  communityId: string;
  name: string;
  description: string;
  image: string | null;
  thumbnail: string | null;
}> {
  const client = await getAd4mClient();
  const dexie = new DexieIPFS(communityId);

  const groupMetaData = await client.perspective.queryProlog(
    communityId,
    `
  triple("${SELF}", "${FLUX_GROUP_NAME}", GN);
  triple("${SELF}", "${FLUX_GROUP_DESCRIPTION}", GD);
  triple("${SELF}", "${FLUX_GROUP_IMAGE}", GI);
  triple("${SELF}", "${FLUX_GROUP_THUMBNAIL}", GT).`
  );

  const group = {
    communityId,
    name: "",
    description: "",
    image: null,
    thumbnail: null,
  };

  if (groupMetaData) {
    for (const link of groupMetaData) {
      if (typeof link.GN == "string") {
        try {
          const nameExp = await Literal.fromUrl(link.GN).get();
          group.name = nameExp.data;
        } catch (e) {
          console.error("Error getting group name", e);
        }
      } else if (typeof link.GD == "string") {
        try {
          const descriptionExp = await Literal.fromUrl(link.GD).get();
          group.description = descriptionExp.data;
        } catch (e) {
          console.error("Error getting group description", e);
        }
      } else if (typeof link.GI == "string") {
        const image = await getImage(link.GI);

        await dexie.save(link.GI, image);

        group.image = link.GI;
      } else if (typeof link.GT == "string") {
        const image = await getImage(link.GT);

        await dexie.save(link.GT, image);

        group.thumbnail = link.GT;
      }
    }
  }

  return group;
}

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const exp = await getGroupMetadata(communityId);

  if (exp) {
    dataStore.updateCommunityMetadata(exp);
  }
};
