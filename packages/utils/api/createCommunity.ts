import { v4 as uuidv4 } from "uuid";
import { PERSPECTIVE_DIFF_SYNC } from "../constants/languages";
import { MEMBER, SELF } from "../constants/communityPredicates";
import { createNeighbourhoodMeta } from "../helpers/createNeighbourhoodMeta";
import { Community } from "../types";
import { Perspective } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
} from "utils/helpers/profileHelpers";
import { createSDNA } from "./createSDNA";
import CommunityModel from "utils/api/community";

export interface Payload {
  name: string;
  image?: string;
  description?: string;
  perspectiveUuid?: string;
}

export default async function createCommunity({
  name,
  description = "",
  image = "",
  perspectiveUuid,
}: Payload): Promise<Community> {
  try {
    const client = await getAd4mClient();
    const agent = await client.agent.me();

    const author = agent.did;

    const perspective = perspectiveUuid
      ? await client.perspective.byUUID(perspectiveUuid)
      : await client.perspective.add(name);

    const uid = uuidv4().toString();

    //Create unique social-context
    const linkLanguage = await client.languages.applyTemplateAndPublish(
      PERSPECTIVE_DIFF_SYNC,
      JSON.stringify({
        uid: uid,
        name: `${name}-link-language`,
      })
    );

    //Publish perspective
    const metaLinks = await createNeighbourhoodMeta(name, description, author);

    let sharedUrl = perspective!.sharedUrl;

    if (!sharedUrl) {
      sharedUrl = await client.neighbourhood.publishFromPerspective(
        perspective!.uuid,
        linkLanguage.address,
        new Perspective(metaLinks)
      );
    }

    let thumbnail = null;
    let compressedImage = null;

    if (image) {
      compressedImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(image as string), 0.6)
      );
      thumbnail = await blobToDataURL(
        await resizeImage(dataURItoBlob(image as string), 0.3)
      );
    }

    const Community = new CommunityModel({
      perspectiveUuid: perspective!.uuid,
    });

    const community = await Community.create({
      name,
      description,
      image: compressedImage,
      thumbnail,
    });

    await Community.addMember({ did: author });

    //Default popular setting is 3 upvotes on thumbsup emoji
    const socialDnaLink = await createSDNA(perspective!.uuid);

    // @ts-ignore
    return {
      uuid: perspective!.uuid,
      author: author,
      timestamp: socialDnaLink.timestamp,
      name: community.name,
      description: community.description || "",
      image: community.image,
      thumbnail: community.thumbnail,
      neighbourhoodUrl: sharedUrl,
      members: [author],
    };
  } catch (e) {
    throw new Error(e);
  }
}
