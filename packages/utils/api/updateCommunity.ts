import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "utils/constants/languages";
import {
  SELF,
  FLUX_GROUP_NAME,
  FLUX_GROUP_DESCRIPTION,
  FLUX_GROUP_IMAGE,
  FLUX_GROUP_THUMBNAIL,
} from "utils/constants/communityPredicates";
import {
  resizeImage,
  dataURItoBlob,
  blobToDataURL,
} from "utils/helpers/profileHelpers";
import { LinkQuery } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { LinkExpression } from "@perspect3vism/ad4m";
import { cacheImage } from "../helpers/cacheImage";

export interface CommunityData {
    communityId: string;
    name?: string;
    description?: string;
    image?: string;
    thumbnail?: string;
}

async function deleteCommunityLinks(communityId: string, updates: CommunityData) {
    const client = await getAd4mClient();
    const deletes = [] as Promise<LinkExpression[]>[];

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

export async function updateCommunity(update: CommunityData): Promise<CommunityData> {
    const client = await getAd4mClient();
    const { communityId, name, description, image, thumbnail } = update;

    await deleteCommunityLinks(communityId, update);

    let tempImage = image;
    let tempThumbnail = thumbnail;

    if (image) {
        const resizedImage = await resizeImage(dataURItoBlob(image as string), 100);

        const thumbnail = await blobToDataURL(resizedImage!);

        tempImage = await client.expression.create(
            image,
            NOTE_IPFS_EXPRESSION_OFFICIAL
        );
        cacheImage(tempImage, image);

        tempThumbnail = await client.expression.create(
            thumbnail,
            NOTE_IPFS_EXPRESSION_OFFICIAL
        );
        cacheImage(tempThumbnail, thumbnail);

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

    return {image: tempImage, thumbnail: tempThumbnail, name, description} as CommunityData
}
