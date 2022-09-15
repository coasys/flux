import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "@/constants/languages";
import { SELF, FLUX_GROUP_NAME, FLUX_GROUP_DESCRIPTION, FLUX_GROUP_IMAGE, FLUX_GROUP_THUMBNAIL } from "@/constants/neighbourhoodMeta";
import { useAppStore } from "@/store/app";

import { resizeImage, dataURItoBlob, blobToDataURL } from "@/utils/profileHelpers";
import { LinkQuery } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";
import { useDataStore } from "..";

export interface Payload {
  communityId: string;
  name?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
}

async function deleteCommunityLinks(communityId: string) {
  const client = await getAd4mClient();
  
  //TODO; this should be prolog queries, but right now we are not able to get the full link expression from prolog
  //we should add hashing for each link expression
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

  for (const link of links) {
    await client.perspective.removeLink(communityId, link);
  }
}

export default async function updateCommunity({
  communityId,
  name,
  description,
  image,
  thumbnail,
}: Payload): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const client = await getAd4mClient();

  const community = dataStore.getCommunity(communityId);

  await deleteCommunityLinks(communityId);

  try {
    let tempImage = image;
    let tempThumbnail = thumbnail;

    if (image) {
      const resizedImage = image
        ? await resizeImage(dataURItoBlob(image as string), 100)
        : undefined;
      
      const thumbnail = image
        ? await blobToDataURL(resizedImage!)
        : undefined;

      tempImage = await client.expression.create(
        image,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      tempThumbnail = await client.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const addGroupImageLink = await client.perspective.addLink(
        communityId,
        {
          source: SELF,
          target: tempImage,
          predicate: FLUX_GROUP_IMAGE,
        }
      );
      const addGroupThumbnailLink = await client.perspective.addLink(
        communityId,
        {
          source: SELF,
          target: tempThumbnail,
          predicate: FLUX_GROUP_THUMBNAIL,
        }
      );  
    }

    const addGroupNameLink = await client.perspective.addLink(
      communityId,
      {
        source: SELF,
        target: name || '-',
        predicate: FLUX_GROUP_NAME,
      }
    );
    const addGroupDescriptionLink = await client.perspective.addLink(
      communityId,
      {
        source: SELF,
        target: description || '-',
        predicate: FLUX_GROUP_DESCRIPTION,
      }
    );

    dataStore.updateCommunityMetadata({
      communityId: community.neighbourhood.perspective.uuid,
      name: name || community.neighbourhood.name,
      description: description || community.neighbourhood.description,
      image: tempImage || community.neighbourhood.image || "",
      thumbnail: tempThumbnail || community.neighbourhood.thumbnail || "",
    });

  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
