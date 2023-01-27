import { v4 as uuidv4 } from "uuid";
import { PERSPECTIVE_DIFF_SYNC } from "../constants/languages";
import { MEMBER, SELF } from "../constants/communityPredicates";
import { Community as FluxCommunity } from "../types";
import { createNeighbourhoodMeta } from "../helpers/createNeighbourhoodMeta";
import { Perspective } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { blobToDataURL, dataURItoBlob, Factory, resizeImage } from "../helpers";
import { createSDNA } from "./createSDNA";
import { Community } from "./community";
import { Member } from "./member";

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
}: Payload): Promise<FluxCommunity> {
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

    console.log("Ensuring classes..")
    
    await perspective.ensureSDNASubjectClass(Community);
    await perspective.ensureSDNASubjectClass(Member);
    const CommunityModel = new Factory(new Community(), {
      perspectiveUuid: perspective.uuid,
    });

    const community = await CommunityModel.create({
      name,
      description,
      image: compressedImage,
      thumbnail,
    });

    const MemberFactory = new Factory(new Member(), {
      perspectiveUuid: perspective.uuid,
    });

    await MemberFactory.create({}, author);

    //Default popular setting is 3 upvotes on thumbsup emoji
    const socialDnaLink = await createSDNA(perspective!.uuid);

    // @ts-ignore
    return {
      uuid: perspective.uuid,
      author: author,
      timestamp: socialDnaLink.timestamp,
      name: await community.name,
      description: await community.description || "",
      image: await community.image,
      thumbnail: await community.thumbnail,
      neighbourhoodUrl: sharedUrl,
      members: [author],
    };
  } catch (e) {
    throw new Error(e);
  }
}
