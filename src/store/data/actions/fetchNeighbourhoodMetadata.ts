import { LinkQuery } from "@perspect3vism/ad4m";

import { useDataStore } from "@/store/data/index";
import { SELF, FLUX_GROUP_NAME, FLUX_GROUP_DESCRIPTION, FLUX_CHANNEL, FLUX_GROUP_IMAGE, FLUX_GROUP_THUMBNAIL } from "@/constants/neighbourhoodMeta";
import { DexieIPFS } from "@/utils/storageHelpers";
import { getImage } from "../../../utils/profileHelpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

export interface Payload {
  communityId: string;
}

export async function getGroupExpression(communityId: string) {
  const client = await getAd4mClient();
  const dexie = new DexieIPFS(communityId);

  const groupNameLink = client.perspective.queryLinks(
    communityId,
    new LinkQuery({
      source: SELF,
      predicate: FLUX_GROUP_NAME,
    })
  );
  const groupDescriptionLink = client.perspective.queryLinks(
    communityId,
    new LinkQuery({
      source: SELF,
      predicate: FLUX_GROUP_DESCRIPTION,
    })
  );
  const groupImageLink = client.perspective.queryLinks(
    communityId,
    new LinkQuery({
      source: SELF,
      predicate: FLUX_GROUP_IMAGE,
    })
  );
  const groupThumbnailLink = client.perspective.queryLinks(
    communityId,
    new LinkQuery({
      source: SELF,
      predicate: FLUX_GROUP_THUMBNAIL,
    })
  );

  const values = await Promise.all([groupNameLink, groupDescriptionLink, groupImageLink, groupThumbnailLink])
  const links = values.flat()
  const group = {
    name: '',
    description: '',
    image: null,
    thumbnail: null
  };


  for (const link of links) {
    if (link.data.predicate === FLUX_GROUP_NAME) {
      group.name = link.data.target
    } else if (link.data.predicate === FLUX_GROUP_DESCRIPTION) {
      group.description = link.data.target
    } else if (link.data.predicate === FLUX_GROUP_IMAGE) {
      const image = await getImage(link.data.target);
  
      await dexie.save(link.data.target, image);

      group.image = link.data.target;
    } else if (link.data.predicate === FLUX_GROUP_THUMBNAIL) {
      const image = await getImage(link.data.target);
  
      await dexie.save(link.data.target, image);

      group.thumbnail = link.data.target;
    }
  }

  return group
}

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const exp = await getGroupExpression(communityId);

  if (exp) {
    dataStore.updateCommunityMetadata(exp);
  }
};
