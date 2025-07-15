import { Perspective } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { Community as FluxCommunity } from "@coasys/flux-types";
import { blobToDataURL, createNeighbourhoodMeta, dataURItoBlob, resizeImage } from "@coasys/flux-utils";
import { v4 as uuidv4 } from "uuid";
import App from "./app";
import { Community } from "./community";
import Conversation from "./conversation";
import ConversationSubgroup from "./conversation-subgroup";
import Embedding from "./embedding";
import SemanticRelationship from "./semantic-relationship";
import Topic from "./topic";

export interface Payload {
  linkLangAddress?: string;
  name: string;
  image?: string;
  description?: string;
  perspectiveUuid?: string;
}

export default async function createCommunity({
  linkLangAddress,
  name,
  description = "",
  image = undefined,
  perspectiveUuid,
}: Payload): Promise<FluxCommunity> {
  try {
    const client = await getAd4mClient();
    const agent = await client.agent.me();
    const author = agent.did;

    // Get or create the perspective
    const perspective = perspectiveUuid
      ? await client.perspective.byUUID(perspectiveUuid)
      : await client.perspective.add(name);

    // Add models to the perspectives SDNA
    await perspective.ensureSDNASubjectClass(Community);
    await perspective.ensureSDNASubjectClass(App);

    // Add conversation models to the perspective's SDNA (TODO: only add these when converting a channel into a conversation)
    await perspective.ensureSDNASubjectClass(Conversation);
    await perspective.ensureSDNASubjectClass(ConversationSubgroup);
    await perspective.ensureSDNASubjectClass(Topic);
    await perspective.ensureSDNASubjectClass(Embedding);
    await perspective.ensureSDNASubjectClass(SemanticRelationship);

    // Create a neighbourhood from the perspective
    const uid = uuidv4().toString();
    const langs = await client.runtime.knownLinkLanguageTemplates();
    const templateData = JSON.stringify({ uid, name: `${name}-link-language` });
    const linkLanguage = await client.languages.applyTemplateAndPublish(linkLangAddress || langs[0], templateData);
    const metaLinks = await createNeighbourhoodMeta(name, description, author);

    let sharedUrl = perspective.sharedUrl;

    if (!sharedUrl) {
      sharedUrl = await client.neighbourhood.publishFromPerspective(
        perspective!.uuid,
        linkLanguage.address,
        new Perspective(metaLinks)
      );
    }

    // Create the community model
    const newCommunity = new Community(perspective, "ad4m://self");
    newCommunity.name = name;
    newCommunity.description = description;

    if (image) {
      // Resize and add image
      const thumbnail = await blobToDataURL(await resizeImage(dataURItoBlob(image as string), 0.3));
      const compressedImage = await blobToDataURL(await resizeImage(dataURItoBlob(image as string), 0.6));
      if (thumbnail)
        newCommunity.thumbnail = { data_base64: thumbnail, name: "community-image", file_type: "image/png" };
      if (compressedImage)
        newCommunity.image = { data_base64: compressedImage, name: "community-image", file_type: "image/png" };
    }

    await newCommunity.save();

    // Update notifications to include the new community
    const notifications = await client.runtime.notifications();
    const notification = notifications.find((notification) => notification.appName === "Flux");

    const notificationId = notification.id;
    delete notification.granted;
    delete notification.id;

    await client.runtime.updateNotification(notificationId, {
      ...notification,
      perspectiveIds: [...notification.perspectiveIds, perspective.uuid],
    });

    return {
      uuid: perspective.uuid,
      author: author,
      id: newCommunity.baseExpression,
      timestamp: newCommunity.timestamp,
      name: newCommunity.name,
      description: newCommunity.description || "",
      image: newCommunity.image,
      thumbnail: newCommunity.thumbnail,
      neighbourhoodUrl: sharedUrl,
      members: [author],
    };
  } catch (e) {
    throw new Error(e);
  }
}
