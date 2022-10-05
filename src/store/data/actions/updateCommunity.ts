import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "@/constants/languages";
import {
  SELF,
  FLUX_GROUP_NAME,
  FLUX_GROUP_DESCRIPTION,
  FLUX_GROUP_IMAGE,
  FLUX_GROUP_THUMBNAIL,
} from "@/constants/neighbourhoodMeta";
import { useAppStore } from "@/store/app";

import {
  resizeImage,
  dataURItoBlob,
  blobToDataURL,
} from "@/utils/profileHelpers";
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

async function deleteCommunityLinks(communityId: string, updates: Payload) {
  const client = await getAd4mClient();
  const deletes = [];

  if (updates.name) {
    deletes.push(
      client.perspective.queryLinks(
        communityId,
        new LinkQuery({
          source: SELF,
          predicate: FLUX_GROUP_NAME,
        })
      )
    );
  }

  if (updates.description) {
    deletes.push(
      client.perspective.queryLinks(
        communityId,
        new LinkQuery({
          source: SELF,
          predicate: FLUX_GROUP_DESCRIPTION,
        })
      )
    );
  }

  if (updates.image) {
    deletes.push(
      client.perspective.queryLinks(
        communityId,
        new LinkQuery({
          source: SELF,
          predicate: FLUX_GROUP_IMAGE,
        })
      )
    );
    deletes.push(
      client.perspective.queryLinks(
        communityId,
        new LinkQuery({
          source: SELF,
          predicate: FLUX_GROUP_THUMBNAIL,
        })
      )
    );
  }

  const values = await Promise.all(deletes);
  const links = values.flat();

  for (const link of links) {
    await client.perspective.removeLink(communityId, link);
  }
}

export default async function updateCommunity(update: Payload): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const client = await getAd4mClient();
  const { communityId, name, description, image, thumbnail } = update;

  const community = dataStore.getCommunity(communityId);

  await deleteCommunityLinks(communityId, update);

  try {
    let tempImage = image;
    let tempThumbnail = thumbnail;

    if (image) {
      const resizedImage = image
        ? await resizeImage(dataURItoBlob(image as string), 100)
        : undefined;

      const thumbnail = image ? await blobToDataURL(resizedImage!) : undefined;

      tempImage = await client.expression.create(
        image,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      tempThumbnail = await client.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      await client.perspective.addLink(communityId, {
        source: SELF,
        target: tempImage,
        predicate: FLUX_GROUP_IMAGE,
      });
      await client.perspective.addLink(communityId, {
        source: SELF,
        target: tempThumbnail,
        predicate: FLUX_GROUP_THUMBNAIL,
      });
    }

    if (name) {
      const nameExpression = await client.expression.create(name, "literal");
      await client.perspective.addLink(communityId, {
        source: SELF,
        target: nameExpression,
        predicate: FLUX_GROUP_NAME,
      });
    }

    if (description) {
      const descriptionExpression = await client.expression.create(
        description,
        "literal"
      );
      await client.perspective.addLink(communityId, {
        source: SELF,
        target: descriptionExpression,
        predicate: FLUX_GROUP_DESCRIPTION,
      });
    }

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
