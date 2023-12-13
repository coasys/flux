import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { Ad4mClient, PerspectiveState } from "@coasys/ad4m";

export interface Payload {
  perspectiveUuid: string;
  callback: (newState: PerspectiveState) => null;
}

export default async function ({
  perspectiveUuid,
  callback,
}: Payload): Promise<void> {
  try {
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(perspectiveUuid);

    perspective?.addSyncStateChangeListener(callback);
  } catch (e) {
    throw new Error(e);
  }
}
