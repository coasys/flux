import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import {
  DESCRIPTION,
  NAME,
  CREATOR,
  CREATED_AT,
  SELF,
  FLUX_GROUP_NAME,
  FLUX_GROUP_DESCRIPTION,
  FLUX_GROUP_IMAGE,
  FLUX_GROUP_THUMBNAIL,
} from "utils/constants/communityPredicates";
import { CommunityMetaData } from "../types";
import { DexieIPFS } from "../helpers/storageHelpers";
import { getImage } from "utils/api/getProfile";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export function getMetaFromNeighbourhood(
  links: LinkExpression[]
): CommunityMetaData {
  return links.reduce(
    (acc, link) => {
      const { predicate, target } = link.data;
      return {
        name:
          predicate === NAME ? Literal.fromUrl(target).get().data : acc.name,
        description:
          predicate === DESCRIPTION
            ? Literal.fromUrl(target).get().data
            : acc.description,
        creatorDid: predicate === CREATOR ? target : acc.creatorDid,
        createdAt: predicate === CREATED_AT ? target : acc.createdAt,
      };
    },
    {
      name: "",
      description: "",
      createdAt: "",
      creatorDid: "",
    }
  );
}

export async function getGroupMetadata(
  perspectiveUuid: string
): Promise<CommunityMetaData> {
  const client = await getAd4mClient();
  const dexie = new DexieIPFS(perspectiveUuid);

  const groupMetaData = await client.perspective.queryProlog(
    perspectiveUuid,
    `
  triple("${SELF}", "${FLUX_GROUP_NAME}", GN);
  triple("${SELF}", "${FLUX_GROUP_DESCRIPTION}", GD);
  triple("${SELF}", "${FLUX_GROUP_IMAGE}", GI);
  triple("${SELF}", "${FLUX_GROUP_THUMBNAIL}", GT).`
  );

  const group = {
    perspectiveUuid,
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
