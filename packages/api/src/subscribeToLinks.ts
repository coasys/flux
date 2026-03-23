import { Ad4mClient } from '@coasys/ad4m';

export interface Payload {
  client: Ad4mClient;
  perspectiveUuid: string;
  added?: any;
  removed?: any;
}

function removeListeners({ perspective, added, removed }) {
  if (added) {
    perspective?.removeListener('link-added', added);
  }

  if (removed) {
    perspective?.removeListener('link-removed', removed);
  }
}

export default async function ({ client, perspectiveUuid, added, removed }: Payload): Promise<Function> {
  try {
    const perspective = await client.perspective.byUUID(perspectiveUuid);

    if (added) {
      perspective?.addListener('link-added', added);
    }

    if (removed) {
      perspective?.addListener('link-removed', removed);
    }

    return removeListeners.bind(this, { perspective, added, removed });
  } catch (e) {
    throw new Error(e);
  }
}
