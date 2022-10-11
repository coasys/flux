import ad4mClient from "./client";

export interface Payload {
  perspectiveUuid: string;
  added?: Function;
  removed?: Function;
}

export default async function ({ perspectiveUuid, added, removed }: Payload) {
  try {
    const perspective = await ad4mClient.perspective.byUUID(perspectiveUuid);
    
    if (added) {
      perspective.addListener('link-added', added);
    }

    if (removed) {
      perspective.addListener('link-removed', removed);
    }

    return perspective;
  } catch (e) {
    throw new Error(e);
  }
}
