import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export interface Payload {
  perspectiveUuid: string;
  added?: Function;
  removed?: Function;
}

export default async function ({ perspectiveUuid, added, removed }: Payload) {
  try {
    const client = await getAd4mClient();

    const perspective = await client.perspective.byUUID(perspectiveUuid);

    if (added) {
      perspective?.addListener("link-added", added);
    }

    if (removed) {
      perspective?.addListener("link-removed", removed);
    }

    return perspective;
  } catch (e) {
    throw new Error(e);
  }
}
