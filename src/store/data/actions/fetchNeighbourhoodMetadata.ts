import { useDataStore } from "@/store/data/index";
import { SELF, FLUX_GROUP_NAME, FLUX_GROUP_DESCRIPTION, FLUX_GROUP_IMAGE, FLUX_GROUP_THUMBNAIL } from "@/constants/neighbourhoodMeta";
import { DexieIPFS } from "@/utils/storageHelpers";
import { getImage } from "../../../utils/profileHelpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

export interface Payload {
  communityId: string;
}

export async function getGroupMetadata(communityId: string) {
  const client = await getAd4mClient();
  const dexie = new DexieIPFS(communityId);
  
  const groupMetaData = await client.perspective.queryProlog(communityId, `
  triple("${SELF}", "${FLUX_GROUP_NAME}", GN).
  triple("${SELF}", "${FLUX_GROUP_DESCRIPTION}", GD). 
  triple("${SELF}", "${FLUX_GROUP_IMAGE}", GI).
  triple("${SELF}", "${FLUX_GROUP_THUMBNAIL}", GT).`);
  
  const group = {
    communityId,
    name: '',
    description: '',
    image: null,
    thumbnail: null
  };


  for (const link of groupMetaData) {
    if (link.GN) {
      group.name = link.GN
    } else if (link.GD) {
      group.description = link.GD
    } else if (link.GI) {
      const image = await getImage(link.GI);
  
      await dexie.save(link.GI, image);

      group.image = link.GI;
    } else if (link.GT) {
      const image = await getImage(link.GT);
  
      await dexie.save(link.GT, image);

      group.thumbnail = link.GT;
    }
  }

  return group
}

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const exp = await getGroupMetadata(communityId);

  if (exp) {
    dataStore.updateCommunityMetadata(exp);
  }
};
