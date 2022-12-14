import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { LinkCallback } from "@perspect3vism/ad4m/lib/src/perspectives/PerspectiveClient";

export interface Payload {
  perspectiveUuid: string;
  added?: any;
  removed?: any;
}

function removeListeners({ perspective, added, removed }) {
  console.log("trying to remove", { perspective, added, removed });

  if (added) {
    perspective?.removeListener("link-added", added);
  }

  if (removed) {
    perspective?.removeListener("link-removed", removed);
  }
}

export default async function ({
  perspectiveUuid,
  added,
  removed,
}: Payload): Promise<Function> {
  try {
    const client = await getAd4mClient();

    const perspective = await client.perspective.byUUID(perspectiveUuid);

    if (added) {
      perspective?.addListener("link-added", added);
    }

    if (removed) {
      perspective?.addListener("link-removed", removed);
    }

    return removeListeners.bind(this, { perspective, added, removed });
  } catch (e) {
    throw new Error(e);
  }
}
