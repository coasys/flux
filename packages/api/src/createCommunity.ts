import { Ad4mClient, Perspective } from '@coasys/ad4m';
// @ts-ignore
import { Community as FluxCommunity } from '@coasys/flux-types';
import { blobToDataURL, createNeighbourhoodMeta, dataURItoBlob, resizeImage } from '@coasys/flux-utils';
import { v4 as uuidv4 } from 'uuid';
import App from './app';
import Channel from './channel';
import { Community } from './community';
import Conversation from './conversation';
import ConversationSubgroup from './conversation-subgroup';
import Embedding from './embedding';
import Message from './message';
import SemanticRelationship from './semantic-relationship';
import Topic from './topic';
import TaskColumn from './task-column';
import Task from './task';
import TaskBoard from './task-board';

export interface Payload {
  linkLangAddress?: string;
  name: string;
  image?: string;
  description?: string;
  perspectiveUuid?: string;
  client: Ad4mClient;
}

export default async function createCommunity({
  linkLangAddress,
  name,
  description = '',
  image = undefined,
  perspectiveUuid,
  client,
}: Payload): Promise<FluxCommunity> {
  try {
    const agent = await client.agent.me();
    const author = agent.did;

    // Get or create the perspective
    const perspective = perspectiveUuid
      ? await client.perspective.byUUID(perspectiveUuid)
      : await client.perspective.add(name);
    if (!perspective) throw new Error('Failed to create or retrieve perspective');

    // Add models to the perspectives SDNA
    await perspective.ensureSDNASubjectClass(Community);
    await perspective.ensureSDNASubjectClass(Channel);
    await perspective.ensureSDNASubjectClass(App);
    await perspective.ensureSDNASubjectClass(Conversation);
    await perspective.ensureSDNASubjectClass(ConversationSubgroup);
    await perspective.ensureSDNASubjectClass(Topic);
    await perspective.ensureSDNASubjectClass(Embedding);
    await perspective.ensureSDNASubjectClass(SemanticRelationship);
    await perspective.ensureSDNASubjectClass(Message);
    await perspective.ensureSDNASubjectClass(TaskBoard);
    await perspective.ensureSDNASubjectClass(TaskColumn);
    await perspective.ensureSDNASubjectClass(Task);

    // Create a neighbourhood from the perspective
    const uid = uuidv4();
    const langs = await client.runtime.knownLinkLanguageTemplates();
    const templateData = JSON.stringify({ uid, name: `${name}-link-language` });
    const templateAddress = linkLangAddress || langs?.[0];
    if (!templateAddress) throw new Error('No link language templates available to publish neighbourhood.');
    const linkLanguage = await client.languages.applyTemplateAndPublish(templateAddress, templateData);
    const metaLinks = await createNeighbourhoodMeta(client, perspective.uuid, name, description, author);

    let sharedUrl = perspective.sharedUrl;

    if (!sharedUrl) {
      sharedUrl = await client.neighbourhood.publishFromPerspective(
        perspective!.uuid,
        linkLanguage.address,
        new Perspective(metaLinks),
      );
    }

    // Resize images if provided
    let thumbnail: string | undefined;
    let compressedImage: string | undefined;
    if (image) {
      thumbnail = await blobToDataURL(await resizeImage(dataURItoBlob(image as string), 0.3));
      compressedImage = await blobToDataURL(await resizeImage(dataURItoBlob(image as string), 0.6));
    }

    // Create the community model
    const newCommunity = await Community.create(perspective, {
      name,
      description,
      ...(thumbnail && { thumbnail: { data_base64: thumbnail, name: 'community-image', file_type: 'image/png' } }),
      ...(compressedImage && {
        image: { data_base64: compressedImage, name: 'community-image', file_type: 'image/png' },
      }),
    });

    // Update notifications to include the new community
    const notifications = await client.runtime.notifications();
    const notification = notifications.find((n) => n.appName === 'Flux');
    if (notification) {
      const notificationId = notification.id;
      await client.runtime.updateNotification(notificationId, {
        description: notification.description,
        appName: notification.appName,
        appUrl: notification.appUrl,
        appIconPath: notification.appIconPath,
        trigger: notification.trigger,
        perspectiveIds: [...(notification.perspectiveIds || []), perspective.uuid],
        webhookUrl: notification.webhookUrl,
        webhookAuth: notification.webhookAuth,
      });
    }

    return {
      uuid: perspective.uuid,
      author: author,
      id: newCommunity.id,
      timestamp: newCommunity.createdAt,
      name: newCommunity.name,
      description: newCommunity.description || '',
      image: newCommunity.image,
      thumbnail: newCommunity.thumbnail,
      neighbourhoodUrl: sharedUrl,
      members: [author],
    };
  } catch (e) {
    throw new Error(e);
  }
}
