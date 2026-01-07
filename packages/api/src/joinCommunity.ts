import { Community } from '@coasys/flux-types';
import { getAd4mClient } from '@coasys/ad4m-connect/utils';
import { getMetaFromLinks } from '@coasys/flux-utils';
import { Ad4mClient } from '@coasys/ad4m';

export interface Payload {
  joiningLink: string;
  client?: Ad4mClient;
}

export default async ({ joiningLink, client }: Payload): Promise<Community> => {
  try {
    const ad4mClient: Ad4mClient = client || await getAd4mClient();
    const agent = await ad4mClient.agent.me();
    const allPerspectives = await ad4mClient.perspective.all();

    const exsistingPerspective = allPerspectives.find((perspective) => {
      perspective.sharedUrl === joiningLink;
    });

    if (exsistingPerspective) {
      throw Error('Neighbourhood already joined!');
    }

    const perspective = await ad4mClient.neighbourhood.joinFromUrl(joiningLink);

    const neighbourhoodMeta = getMetaFromLinks(perspective.neighbourhood!.data.meta.links);

    await ad4mClient.perspective.update(perspective.uuid, neighbourhoodMeta.name);

    const notifications = await ad4mClient.runtime.notifications();

    const notification = notifications.find((notification) => notification.appName === 'Flux');

    const notificationId = notification.id;
    delete notification.granted;
    delete notification.id;

    await ad4mClient.runtime.updateNotification(notificationId, {
      ...notification,
      perspectiveIds: [...notification.perspectiveIds, perspective.uuid],
    });

    return {
      uuid: perspective!.uuid,
      author: neighbourhoodMeta.author!,
      timestamp: neighbourhoodMeta.timestamp!,
      name: neighbourhoodMeta.name,
      description: neighbourhoodMeta.description || '',
      image: '',
      thumbnail: '',
      neighbourhoodUrl: perspective.sharedUrl!,
      members: [agent.did],
      id: '',
    };
  } catch (e) {
    throw new Error(e);
  }
};
