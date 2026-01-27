import { Ad4mClient, PerspectiveState } from '@coasys/ad4m';

export interface Payload {
  client: Ad4mClient;
  perspectiveUuid: string;
  callback: (newState: PerspectiveState) => null;
}

export default async function ({ client, perspectiveUuid, callback }: Payload): Promise<void> {
  try {
    const perspective = await client.perspective.byUUID(perspectiveUuid);

    perspective?.addSyncStateChangeListener(callback);
  } catch (e) {
    throw new Error(e);
  }
}
