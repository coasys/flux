import { ad4mClient } from "@/app";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "@/constants/languages";
import { SELF, FLUX_GROUP } from "@/constants/neighbourhoodMeta";
import { useAppStore } from "@/store/app";

import { ExpressionTypes } from "@/store/types";
import { resizeImage, dataURItoBlob, blobToDataURL } from "@/utils/profileHelpers";
import { useDataStore } from "..";

export interface Payload {
  communityId: string;
  name?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
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

  const community = dataStore.getCommunity(communityId);

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

      tempImage = await ad4mClient.expression.create(
        image,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      tempThumbnail = await ad4mClient.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );
    }
    const groupExpressionLang =
      community.neighbourhood.typedExpressionLanguages.find(
        (val: any) => val.expressionType == ExpressionTypes.GroupExpression
      );

    if (groupExpressionLang != undefined) {
      console.log("Found group exp lang", groupExpressionLang);
      const groupExpression = await ad4mClient.expression.create(
        { 
          name, 
          description, 
          image: tempImage, 
          thumbnail: tempThumbnail
        },
        groupExpressionLang.languageAddress
      );

      console.log(
        "Created new group expression for updateCommunity",
        groupExpression
      );

      const addGroupExpLink = await ad4mClient.perspective.addLink(
        community.neighbourhood.perspective.uuid,
        {
          source: SELF,
          target: groupExpression,
          predicate: FLUX_GROUP,
        }
      );
      console.log("Created group expression link", addGroupExpLink);

      dataStore.updateCommunityMetadata({
        communityId: community.neighbourhood.perspective.uuid,
        name: name || community.neighbourhood.name,
        description: description || community.neighbourhood.description,
        image: tempImage || community.neighbourhood.image || "",
        thumbnail: tempThumbnail || community.neighbourhood.thumbnail || "",
        groupExpressionRef: groupExpression,
      });
    } else {
      throw Error("Expected to find group expression language for group");
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
